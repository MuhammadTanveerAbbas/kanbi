import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const error = err as Error
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabase = createServerClient()

  try {
    const { data: existing } = await supabase
      .from('processed_webhook_events')
      .select('id')
      .eq('id', event.id)
      .single()

    if (existing) {
      return NextResponse.json({ received: true })
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        if (!userId) {
          console.error('[webhook] checkout.session.completed: No user ID in checkout session metadata')
          break
        }

        try {
          const subscriptionData = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const { error: upsertErr } = await supabase
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan: 'premium',
              status: subscriptionData.status === 'active' ? 'active' : 'incomplete',
              stripe_subscription_id: subscriptionData.id,
              current_period_end: new Date(((subscriptionData as any).current_period_end || 0) * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            })

          if (upsertErr) console.error('[webhook] checkout.session.completed:', upsertErr.message)
        } catch (err) {
          console.error('[webhook] checkout.session.completed:', err)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            const { error: updateErr } = await supabase
              .from('subscriptions')
              .update({
                plan: 'free',
                status: 'canceled',
                stripe_subscription_id: null,
                current_period_end: null,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.id)
            if (updateErr) console.error('[webhook] customer.subscription.deleted:', updateErr.message)
          }
        } catch (err) {
          console.error('[webhook] customer.subscription.deleted:', err)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            const subscriptionData = await stripe.subscriptions.retrieve(
              (invoice as any).subscription as string
            )
            const { error: updateErr } = await supabase
              .from('subscriptions')
              .update({
                status: subscriptionData.status === 'past_due' ? 'past_due' : 'canceled',
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.id)
            if (updateErr) console.error('[webhook] invoice.payment_failed:', updateErr.message)
          }
        } catch (err) {
          console.error('[webhook] invoice.payment_failed:', err)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscriptionData = event.data.object as Stripe.Subscription
        const customerId = subscriptionData.customer as string

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            const { error: updateErr } = await supabase
              .from('subscriptions')
              .update({
                status: subscriptionData.status === 'active' ? 'active' : 'canceled',
                current_period_end: new Date(((subscriptionData as any).current_period_end || 0) * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.id)
            if (updateErr) console.error('[webhook] customer.subscription.updated:', updateErr.message)
          }
        } catch (err) {
          console.error('[webhook] customer.subscription.updated:', err)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    try {
      await supabase
        .from('processed_webhook_events')
        .insert({ id: event.id })
    } catch (insertErr) {
      const isConflict = (insertErr as { code?: string })?.code === '23505'
      if (!isConflict) console.error('[webhook] Failed to record processed event:', insertErr)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
