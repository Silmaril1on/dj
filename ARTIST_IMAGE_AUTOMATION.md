# Artist Image Upload Automation

## Overview

Automated system to upload artist images from `/public/artist-photos` to pending artists in the database.

## How It Works

### 1. Image Naming Convention

Images in `/public/artist-photos` must follow this naming pattern:

- Convert artist name to lowercase
- Replace spaces with hyphens (`-`)
- Keep special characters like `&`
- Support `.webp`, `.png`, `.jpg`, or `.jpeg` extensions

**Examples:**

- `SPACE MOTION` → `space-motion.jpg`
- `aly & fur` → `aly&fur.webp`
- `John O'Callaghan` → `john-o'callaghan.jpg`
- `TH;EN` → `then.jpg`

### 2. Files Created

#### Helper Functions (`app/helpers/imageAutomation.js`)

- `normalizeArtistName(name)` - Converts artist name to filename format
- `findArtistImage(artistName, stageName)` - Finds matching image file
- `getAvailableArtistImages()` - Lists all available images

#### API Endpoint (`app/api/admin/upload-artist-images/route.js`)

- **GET** - Preview which artists will receive images
- **POST** - Execute the upload automation

#### UI Component (`app/pages/administration/submittions/ImageUploadAutomation.jsx`)

- Preview button - Shows which artists have matching images
- Upload button - Executes the automation

### 3. Usage

1. **Navigate to Admin Panel**
   - Go to `/administration/submitted-artists`

2. **Preview (Optional)**
   - Click "Preview" button to see:
     - Total pending artists without images
     - How many have matching images
     - List of artists and their match status

3. **Upload Images**
   - Click "Upload Images" button
   - Confirm the action
   - Wait for processing
   - Page auto-reloads after success

### 4. Process Flow

For each pending artist without an image:

1. Find matching image file in `/public/artist-photos`
2. Read the image file
3. Upload to Supabase `artist_profile_images` bucket
4. Generate public URL
5. Update artist record with image URL
6. Show success/failure result

### 5. Error Handling

- **No matching image**: Artist is skipped, logged in results
- **Upload fails**: Error logged, next artist processed
- **Database update fails**: Uploaded image is deleted, error logged

### 6. API Response Format

```json
{
  "success": true,
  "message": "Processed 10 artists: 8 successful, 2 failed",
  "processed": 10,
  "successCount": 8,
  "failCount": 2,
  "results": [
    {
      "artistId": "123",
      "artistName": "Space Motion",
      "status": "success",
      "imageUrl": "https://...",
      "sourceFile": "space-motion.jpg"
    }
  ]
}
```

## Manual API Testing

### Preview

```bash
curl http://localhost:3000/api/admin/upload-artist-images
```

### Execute Upload

```bash
curl -X POST http://localhost:3000/api/admin/upload-artist-images
```

## Notes

- Only processes artists with `status = "pending"` AND `artist_image = null`
- Images are uploaded with unique filenames to prevent conflicts
- Original filenames in `/public/artist-photos` are preserved
- Page auto-reloads after successful uploads to show updated data
