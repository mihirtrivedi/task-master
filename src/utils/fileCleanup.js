const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const deleteAttachmentFiles = (attachments) => {
  for (const attachment of attachments) {
    const filename = path.basename(attachment.fileUrl);
    const filePath = path.join(uploadDir, filename);

    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        if (process.env.NODE_ENV !== 'test') {
          console.error(`Failed to delete file ${filePath}:`, err.message);
        }
      }
    }
  }
};

module.exports = { deleteAttachmentFiles };
