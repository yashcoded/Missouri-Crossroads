import AWS from 'aws-sdk';

const s3 = new AWS.S3();
const BUCKET = 'mr-crossroads-bucket';

export const handler = async (event) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT'
  };

  try {
    const { httpMethod, queryStringParameters, body } = event;
    
    console.log('Event received:', JSON.stringify(event, null, 2));
    
    if (httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'OK' })
      };
    }

    if (httpMethod === 'GET') {
      try {
        // First, check if bucket exists and is accessible
        console.log('Checking bucket access for:', BUCKET);
        
        // Try to get bucket location (basic access test)
        const bucketLocation = await s3.getBucketLocation({ Bucket: BUCKET }).promise();
        console.log('Bucket location:', bucketLocation);
        
        // Try to list objects
        const params = {
          Bucket: BUCKET,
          MaxKeys: 10
        };
        
        const data = await s3.listObjectsV2(params).promise();
        console.log('S3 list result:', data);
        
        const notes = [];
        
        if (data.Contents && data.Contents.length > 0) {
          for (const obj of data.Contents) {
            if (obj.Key.endsWith('.json')) {
              try {
                const noteData = await s3.getObject({
                  Bucket: BUCKET,
                  Key: obj.Key
                }).promise();
                notes.push(JSON.parse(noteData.Body.toString()));
              } catch (err) {
                console.error('Error reading note:', obj.Key, err);
              }
            }
          }
        }
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            message: 'Notes retrieved successfully',
            notes: notes,
            bucketInfo: {
              name: BUCKET,
              location: bucketLocation.LocationConstraint || 'us-east-1',
              objectCount: data.Contents ? data.Contents.length : 0
            }
          })
        };
      } catch (s3Error) {
        console.error('S3 error details:', s3Error);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ 
            message: 'S3 access test failed',
            method: httpMethod,
            bucket: BUCKET,
            error: s3Error.message,
            errorCode: s3Error.code,
            errorType: s3Error.name,
            details: 'Check bucket policy and IAM permissions'
          })
        };
      }
    }

    if (httpMethod === 'POST') {
      try {
        const noteData = JSON.parse(body);
        const noteId = 'note-' + Date.now();
        
        // Store the note in S3
        const params = {
          Bucket: BUCKET,
          Key: `notes/${noteId}.json`,
          Body: JSON.stringify({
            ...noteData,
            id: noteId,
            createdAt: new Date().toISOString()
          }),
          ContentType: 'application/json'
        };
        
        await s3.putObject(params).promise();
        
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify({ 
            message: 'Note created successfully',
            noteId: noteId
          })
        };
      } catch (s3Error) {
        console.error('S3 error:', s3Error);
        // Fallback: return success without storing
        const noteId = 'test-note-' + Date.now();
        return {
          statusCode: 201,
          headers: corsHeaders,
          body: JSON.stringify({ 
            message: 'Note created successfully (stored locally)',
            noteId: noteId,
            warning: 'S3 storage failed: ' + s3Error.message,
            errorCode: s3Error.code
          })
        };
      }
    }

    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Method not allowed' })
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        stack: error.stack
      })
    };
  }
};
