import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
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

  const supabase = await createClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        if (!userId) {
          console.error('No user ID in checkout session metadata')
          break
        }

        const subscriptionData = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await supabase
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

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({
              plan: 'free',
              status: 'canceled',
              stripe_subscription_id: null,
              current_period_end: null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          const subscriptionData = await stripe.subscriptions.retrieve(
            (invoice as any).subscription as string
          )

          await supabase
            .from('subscriptions')
            .update({
              status: subscriptionData.status === 'past_due' ? 'past_due' : 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscriptionData = event.data.object as Stripe.Subscription
        const customerId = subscriptionData.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile) {
          await supabase
            .from('subscriptions')
            .update({
              status: subscriptionData.status === 'active' ? 'active' : 'canceled',
              current_period_end: new Date(((subscriptionData as any).current_period_end || 0) * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', profile.id)
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
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
