import { supabase } from './supabase'

// Use the existing bucket
const BUCKET_NAME = 'canvas-assets'

/**
 * Upload a file to Supabase Storage and return the public URL
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The public URL of the uploaded file
 */
export async function uploadCanvasAsset(file) {
  // Generate unique filename and put it in a 'canvas/' folder to keep things organized
  const fileExt = file.name.split('.').pop()
  const fileName = `canvas/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
  
  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file)
  
  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName)
  
  return urlData.publicUrl
}
