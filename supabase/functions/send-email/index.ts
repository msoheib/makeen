import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface EmailData {
  to: string;
  subject: string;
  html: string;
  firstName: string;
  password: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    })
  }

  try {
    const { to, subject, html, firstName, password }: EmailData = await req.json()

    // Validate required fields
    if (!to || !subject || !html || !firstName || !password) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          }
        }
      )
    }

    // For now, we'll just log the email data
    // In production, you would integrate with a real email service like SendGrid, Mailgun, etc.
    console.log('Email notification:', {
      to,
      subject,
      firstName,
      password: '***hidden***', // Don't log actual password
      timestamp: new Date().toISOString()
    })

    // Here you would typically send the email using a service like:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    // - etc.

    // For demonstration, we'll simulate a successful email send
    const emailResult = {
      success: true,
      messageId: `demo-${Date.now()}`,
      message: 'Email logged successfully (demo mode)'
    }

    return new Response(
      JSON.stringify(emailResult),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )

  } catch (error) {
    console.error('Email function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process email request',
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      }
    )
  }
}) 