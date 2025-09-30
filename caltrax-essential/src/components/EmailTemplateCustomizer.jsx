import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Save, Eye, Code } from 'lucide-react';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';

export default function EmailTemplateCustomizer() {
  const [activeTab, setActiveTab] = useState('preview');
  const [emailTemplate, setEmailTemplate] = useState({
    subject: 'Verify your CalTrax account',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify your CalTrax account</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8f9fa; }
          .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
          .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px 20px; text-align: center; }
          .logo { color: #ffffff; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .tagline { color: #94a3b8; font-size: 16px; }
          .content { padding: 40px 20px; }
          .title { color: #1e293b; font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; }
          .message { color: #64748b; font-size: 16px; line-height: 1.6; margin-bottom: 30px; }
          .button { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; text-align: center; }
          .button:hover { background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); }
          .footer { background-color: #f8f9fa; padding: 30px 20px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer-text { color: #64748b; font-size: 14px; margin-bottom: 10px; }
          .footer-link { color: #3b82f6; text-decoration: none; }
          .security-note { background-color: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 20px 0; }
          .security-note-text { color: #92400e; font-size: 14px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CalTrax</div>
            <div class="tagline">Your Personal Nutrition Assistant</div>
          </div>
          
          <div class="content">
            <h1 class="title">Welcome to CalTrax!</h1>
            <p class="message">
              Thank you for signing up! To complete your account setup and start tracking your nutrition, 
              please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="{{ .ConfirmationURL }}" class="button">Verify Email Address</a>
            </div>
            
            <div class="security-note">
              <p class="security-note-text">
                <strong>Security Note:</strong> This verification link will expire in 24 hours. 
                If you didn't create an account with CalTrax, please ignore this email.
              </p>
            </div>
            
            <p class="message">
              Once verified, you'll have access to our advanced nutrition tracking features, 
              personalized meal plans, and AI-powered food analysis.
            </p>
          </div>
          
          <div class="footer">
            <p class="footer-text">
              This email was sent from CalTrax. If you have any questions, 
              contact us at <a href="mailto:support@caltrax.ai" class="footer-link">support@caltrax.ai</a>
            </p>
            <p class="footer-text">
              CalTrax - Your Personal Nutrition Assistant
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
      Welcome to CalTrax!
      
      Thank you for signing up! To complete your account setup and start tracking your nutrition, 
      please verify your email address by clicking the link below:
      
      {{ .ConfirmationURL }}
      
      Security Note: This verification link will expire in 24 hours. 
      If you didn't create an account with CalTrax, please ignore this email.
      
      Once verified, you'll have access to our advanced nutrition tracking features, 
      personalized meal plans, and AI-powered food analysis.
      
      If you have any questions, contact us at support@caltrax.ai
      
      CalTrax - Your Personal Nutrition Assistant
    `
  });

  const handleSaveTemplate = () => {
    // This would typically save to Supabase or your backend
    console.log('Saving email template:', emailTemplate);
    alert('Email template saved! (This would integrate with Supabase in production)');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Email Template Customizer</h1>
          <p className="text-zinc-400">Customize your verification emails to match your CalTrax branding</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Template Editor */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Code className="w-5 h-5" />
                Template Editor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={emailTemplate.subject}
                  onChange={(e) => setEmailTemplate({...emailTemplate, subject: e.target.value})}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  HTML Template
                </label>
                <textarea
                  value={emailTemplate.html}
                  onChange={(e) => setEmailTemplate({...emailTemplate, html: e.target.value})}
                  rows={15}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Plain Text Template
                </label>
                <textarea
                  value={emailTemplate.text}
                  onChange={(e) => setEmailTemplate({...emailTemplate, text: e.target.value})}
                  rows={10}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>

              <Button
                onClick={handleSaveTemplate}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Template
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Email Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border border-zinc-700 rounded-lg overflow-hidden">
                <div className="bg-zinc-800 px-4 py-2 border-b border-zinc-700">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm text-zinc-300">From: noreply@caltrax.ai</span>
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">
                    Subject: {emailTemplate.subject}
                  </div>
                </div>
                <div 
                  className="p-4 bg-white text-black"
                  dangerouslySetInnerHTML={{ 
                    __html: emailTemplate.html.replace('{{ .ConfirmationURL }}', 'https://caltrax.ai/verify?token=example123')
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 bg-blue-900/30 border border-blue-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-200 mb-3">📧 Supabase Email Configuration</h3>
          <div className="text-sm text-blue-100 space-y-2">
            <p><strong>1. Go to Supabase Dashboard → Authentication → Settings</strong></p>
            <p><strong>2. Find "Email" section and enable "Confirm email"</strong></p>
            <p><strong>3. Go to "Templates" tab to customize the email template</strong></p>
            <p><strong>4. Set up custom SMTP with your caltrax.ai domain</strong></p>
            <p><strong>5. Use the template above as a starting point</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}

