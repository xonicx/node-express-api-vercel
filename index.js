const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const streamifier = require('streamifier');
const { drive } = require('googleapis/build/src/apis/drive');
const { sql } = require("@vercel/postgres");


const app = express();

app.use(bodyParser.json({ limit: '50mb' }));
app.use(cors());

// Set up multer for handling file uploads
//const upload = multer({ storage: multer.memoryStorage() });  // Use memory storage to handle file buffers
const upload = multer();


// Replace with your own client ID and client secret
const YOUR_CLIENT_ID = '178718847296-n57uis2go4c6dgihvuuda1h3sg8p9kal.apps.googleusercontent.com';
const YOUR_CLIENT_SECRET = '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';
const YOUR_REDIRECT_URI = 'http://localhost:8080';
const MASTER_SHEET = '1EWn07TEaEfz0yox5TeAF6qaeLCWp9qyazC2m72_ucoI'
// OAuth client setup
const oauth2Client = new OAuth2Client(YOUR_CLIENT_ID, YOUR_CLIENT_SECRET, YOUR_REDIRECT_URI);

// Set the Bearer token for authentication
const setAccessToken = (accessToken) => {
  oauth2Client.setCredentials({ access_token: accessToken });
};

// Function to check and create a folder
const checkAndCreateFolder = async (folderName, drive) => {
  console.log("checkAndCreateFolder: finding Id for folder: ", folderName);
  try {
    // Check if the folder exists
    const folderQueryResponse = await drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id)',
    });

    // If the folder doesn't exist, create it
    let folderId;
    if (!folderQueryResponse.data.files || folderQueryResponse.data.files.length === 0) {
      console.log("checkAndCreateFolder: folder new found. creating new ");
      const folderCreationResponse = await drive.files.create({
        requestBody: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });

      folderId = folderCreationResponse.data.id;
    } else {
      console.log("checkAndCreateFolder: found folder : ", folderQueryResponse.data.files);
      // Folder already exists, use its ID
      folderId = folderQueryResponse.data.files[0].id;
    }

    return folderId;
  } catch (error) {
    console.error('Error checking and creating folder:', error);
    throw error;
  }
};

const getFileOrFolderId = async (name, drive) => {
  const response = await drive.files.list({
    q: `name='${name}' and trashed=false`,
    fields: 'files(id, mimeType)',
  });

  if (response.data.files.length > 0) {
    // File or folder found, return its ID
    return response.data.files[0].id;
  } else {
    throw new Error(`File or folder with name '${name}' not found.`);
  }
};

// Function to upload or update a file
const uploadOrUpdateFile = async (folderId, file, drive) => {
  try {
    // setAccessToken(accessToken);

    // // Build the Google Drive API service
    // const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Build the request body
    const requestBody = {
      name: file.originalname,
      parents: [folderId],
      fields: 'id',
    };

    // Check if the file with the same name already exists in the folder
    const existingFilesResponse = await drive.files.list({
      q: `name='${file.originalname}' and '${folderId}' in parents`,
      fields: 'files(id, modifiedTime)',
    });

    // If the file already exists, update its content and modified date
    if (existingFilesResponse.data.files && existingFilesResponse.data.files.length > 0) {
      requestBody.modifiedTime = new Date().toISOString();
    }

    // Create a readable stream from the file buffer
    const media = {
      mimeType: file.mimetype,
      body: streamifier.createReadStream(file.buffer),
    };

    // Create or update the file in Google Drive
    const driveFile = await drive.files.create({
      requestBody,
      media,
    });

    // Log the file ID
    console.log('File Id:', driveFile.data.id);

    return driveFile.data.id;
  } catch (error) {
    console.error('Error uploading or updating file in Google Drive:', error);
    throw error;
  }
};


app.post('/upload-to-drive', upload.single('file'), async (req, res) => {
  try {
    //console.log("req:", req)
    const { file } = req;
    const { accessToken, folderName } = req.body;
    //console.log("filedata:", file.buffer);

    // Replace with your own logic for extracting the Bearer token from the client request
    //const accessToken = req.headers.authorization.split(' ')[1];
    console.log("foldername:", folderName, "token:", accessToken);
    setAccessToken(accessToken);


    // Build the Google Drive API service
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const driveContentsResponse = await drive.files.list({
      fields: 'files(id, name, mimeType)',
      q: "trashed=false", // Exclude trashed items
    });

    // Extract file and folder information
    const filesAndFolders = driveContentsResponse.data.files;

    console.log("filesAndFolders:", filesAndFolders);

    // // Specify the folder name where you want to upload the file
    //const folderName = 'simbaprojects';
    const rootfolderId = await checkAndCreateFolder(folderName, drive);

    console.log("rootfolderId:", rootfolderId);

    const fileId = await uploadOrUpdateFile(rootfolderId, file, drive);
    console.log("fileId:", fileId);

    // Respond with success
    res.status(200).json({ success: true, fileId: fileId });
  } catch (error) {
    // Log the error
    console.error('Error uploading to Google Drive:', error);

    // Respond with an error
    res.status(500).json({ success: false, error: error.message });
  }
});

// Function to download a file by name
const downloadFileByName = async (folderName, fileName, drive) => {
  try {
    //setAccessToken(accessToken);

    // Build the Google Drive API service
    //const drive = google.drive({ version: 'v3', auth: oauth2Client });
    const folderId = await getFileOrFolderId(folderName, drive);

    // Search for the file by name in the specified folder
    const fileListResponse = await drive.files.list({
      q: `name='${fileName}' and '${folderId}' in parents`,
      fields: 'files(id)',
    });

    if (fileListResponse.data.files && fileListResponse.data.files.length > 0) {
      const fileId = fileListResponse.data.files[0].id;

      // Get the file content using the file ID
      const fileContentResponse = await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' }
      );

      return fileContentResponse.data;
    } else {
      throw new Error(`File not found: ${fileName}`);
    }
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

// Endpoint to download a file by name
app.post('/download-file', async (req, res) => {
  try {
    //const { fileName, folderId, accessToken } = req.body;
    const { fileName, folderName, accessToken } = req.body;

    setAccessToken(accessToken);

    // Build the Google Drive API service
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    if (!fileName || !folderName || !accessToken) {
      return res.status(400).json({ success: false, error: 'Invalid parameters.' });
    }

    // Download the file content
    const fileContent = await downloadFileByName(folderName, fileName, drive);

    // Set response headers for file download
    res.setHeader('Content-disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-type', 'application/octet-stream');

    // Send the file content as the response
    fileContent.pipe(res);
  } catch (error) {
    console.error('Error handling file download request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Function to append a row to the specified sheet
async function appendRowToSheet(auth, spreadsheetId, sheetName, rowData) {
  const sheets = google.sheets({ version: 'v4', auth });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: {
      values: [rowData],
    },
  });
}

app.post('/update-sheet', async (req, res) => {
  try {
    const { accessToken, data } = req.body;
    const prName = data.values[0];

    setAccessToken(accessToken);;

    // ID of the Google Sheet
    const spreadsheetId = MASTER_SHEET;
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });


    // Specify the sheet and range
    const range = 'Sheet1'; // Adjust the range accordingly

    // Authorize the client and make the API request to get values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    // Access the values in the response object
    const values = response.data.values;

    // Find the index of the row with the specified search value in the first column
    const rowIndex = values ? values.findIndex(row => row[0] === prName) : -1;

    if (rowIndex !== -1) {
      console.log("update-sheet: updating project:", prName, "data:", data);
      // Update the row with new data
      values[rowIndex] = data;

      // Update the Google Sheet with the modified values
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'RAW',
        resource: {
          values: [values[rowIndex]],
        },
      });

      res.status(200).json({ success: true, message: 'Row updated successfully', updatedRow: values[rowIndex] });
    } else {
      console.log("update-sheet: adding project:", prName, "data:", data);
      await appendRowToSheet(oauth2Client, MASTER_SHEET, 'Sheet1', data);
      //res.status(404).json({ success: false, message: 'Row not found with search value', searchValue });
    }
  } catch (error) {
    console.error('Error updating Google Sheet:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/list-projects', async (req, res) => {
  try {
    await createTable();
    await writeData();
    await readData();
    // Set the access token for authentication
    const accessToken = req.headers.authorization.split(' ')[1];
    setAccessToken(accessToken);

    // ID of the Google Sheet
    const spreadsheetId = MASTER_SHEET;
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

    // Specify the sheet and range
    const range = 'Sheet1'; // Adjust the range accordingly

    // Authorize the client and make the API request to get values
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    // Access the values in the response object
    const values = response.data.values;

    // Extract project names (assuming project names are in the first column)
    const projectNames = values.map(row => row[0]);

    res.status(200).json({ success: true, projectNames });
  } catch (error) {
    console.error('Error listing projects:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});


async function createTable() {
 
  try {
    // Define the table schema
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS your_table (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL
      );
    `;

    // Execute the query to create the table
    await sql.query(createTableQuery);

    console.log('Table created successfully');

    return 'Table created successfully';
  } catch (error) {
    console.error('Error creating table:', error);

    return 'Error creating table';
  } finally {
    // Close the database connection
    await sql.end();
  }
}

// This is an example function that writes data to the database
async function writeData() {
  // Connect to the database

  try {
    // Example data to be inserted
    const sampleData = {
      user_id: 'sample_user',
      item_name: 'Sample Item',
      quantity: 10,
    };

    // Insert data into the database
    const result = await client.query(
      sql`INSERT INTO your_table (user_id, item_name, quantity) VALUES (${sampleData.user_id}, ${sampleData.item_name}, ${sampleData.quantity})`
    );

    console.log('Data inserted successfully:', result);

    return 'Data inserted successfully';
  } catch (error) {
    console.error('Error inserting data:', error);

    return 'Error inserting data';
  } finally {
    // Close the database connection
    await client.end();
  }
}

async function readData() {

  try {
    // Select all rows from the table
    const result = await client.query(sql`SELECT * FROM your_table`);
    const rows = result.rows;

    console.log('Data read successfully:', rows);

    return rows;
  } catch (error) {
    console.error('Error reading data:', error);

    return 'Error reading data';
  } finally {
    // Close the database connection
    await client.end();
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test Server is running on port ${PORT}`);
});

// Export the Express API
module.exports = app
