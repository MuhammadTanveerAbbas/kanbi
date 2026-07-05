import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logging/logger'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover' as any,
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
    logger.error('Webhook signature verification failed', { message: error.message })
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  const supabaseAdmin = createAdminClient()

  try {
    const { data: existing } = await supabaseAdmin
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
          logger.error('[webhook] checkout.session.completed: No user ID in metadata', {})
          break
        }

        try {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string
          )

          const currentPeriodEnd = 'current_period_end' in sub
            ? new Date((sub as any).current_period_end * 1000).toISOString()
            : null

          const { error: upsertErr } = await supabaseAdmin
            .from('subscriptions')
            .upsert({
              user_id: userId,
              plan: 'premium',
              status: sub.status === 'active' ? 'active' : 'incomplete',
              stripe_subscription_id: sub.id,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id',
            })

          if (upsertErr) logger.error('[webhook] checkout.session.completed', { message: upsertErr.message })
        } catch (err) {
          logger.error('[webhook] checkout.session.completed', { error: err })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            const { error: updateErr } = await supabaseAdmin
              .from('subscriptions')
              .update({
                plan: 'free',
                status: 'canceled',
                stripe_subscription_id: null,
                current_period_end: null,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.id)
            if (updateErr) logger.error('[webhook] customer.subscription.deleted', { message: updateErr.message })
          }
        } catch (err) {
          logger.error('[webhook] customer.subscription.deleted', { error: err })
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            const subscriptionId = (invoice as any).subscription as string
            const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId)
            const { error: updateErr } = await supabaseAdmin
              .from('subscriptions')
              .update({
                status: subscriptionData.status === 'past_due' ? 'past_due' : 'canceled',
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.id)
            if (updateErr) logger.error('[webhook] invoice.payment_failed', { message: updateErr.message })
          }
        } catch (err) {
          logger.error('[webhook] invoice.payment_failed', { error: err })
        }
        break
      }

      case 'customer.subscription.updated': {
        const subData = event.data.object as Stripe.Subscription
        const customerId = subData.customer as string

        try {
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single()

          if (profile) {
            const currentPeriodEnd = 'current_period_end' in subData
              ? new Date((subData as any).current_period_end * 1000).toISOString()
              : null

            const { error: updateErr } = await supabaseAdmin
              .from('subscriptions')
              .update({
                status: subData.status === 'active' ? 'active' : 'canceled',
                current_period_end: currentPeriodEnd,
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', profile.id)
            if (updateErr) logger.error('[webhook] customer.subscription.updated', { message: updateErr.message })
          }
        } catch (err) {
          logger.error('[webhook] customer.subscription.updated', { error: err })
        }
        break
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`, {})
    }

    await supabaseAdmin
      .from('processed_webhook_events')
      .insert({ id: event.id })

    return NextResponse.json({ received: true })
  } catch (error) {
    logger.error('Error processing webhook', { error })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
