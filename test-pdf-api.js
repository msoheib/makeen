// Test script for PDF API
// Run with: node test-pdf-api.js

const fetch = require('node-fetch');

const projectId = 'fbabpaorcvatejkrelrf';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZiYWJwYW9yY3ZhdGVqa3JlbHJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNjYzMzMsImV4cCI6MjA2Mzg0MjMzM30.L_DLnMQUw7cepGKjtrbkFZ_E6Rsz4pecAtnUrbc0F5w';
const edgeFunctionUrl = `https://${projectId}.supabase.co/functions/v1/pdf-generator`;

async function testPDFGeneration() {
  console.log('Testing PDF generation...');
  
  const request = {
    reportType: 'revenue',
    dateRange: {
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString(),
      endDate: new Date().toISOString()
    }
  };

  try {
    console.log('Sending request:', JSON.stringify(request, null, 2));
    
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey
      },
      body: JSON.stringify(request)
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return false;
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/pdf')) {
      console.log('✅ PDF generated successfully!');
      const pdfBuffer = await response.buffer();
      console.log('PDF size:', pdfBuffer.length, 'bytes');
      return true;
    } else {
      const jsonResponse = await response.json();
      console.log('JSON response:', jsonResponse);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

// Run the test
testPDFGeneration()
  .then(success => {
    if (success) {
      console.log('\n🎉 PDF API is working correctly!');
    } else {
      console.log('\n❌ PDF API test failed. Check the logs above for details.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test script error:', error);
    process.exit(1);
  }); 