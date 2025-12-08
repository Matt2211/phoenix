// /server/api/send-email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  try {
    await resend.emails.send({
      from: 'Lisa Marini - Contact <hello@matteofelicidesign.com>', // o verified sender
      to: 'matteofelicidesign@gmail.com',
      subject: `New message from ${body.name}`,
      html: `
        <p><strong>Name:</strong> ${body.name}</p>
        <p><strong>Email:</strong> ${body.email}</p>
        <p><strong>Role:</strong> ${body.role}</p>
        <p><strong>Message:</strong><br/>${body.message}</p>
      `,
    })

    return { success: true }
  } catch (error) {
    console.error('Resend error:', error)
    return { success: false, error }
  }
})
