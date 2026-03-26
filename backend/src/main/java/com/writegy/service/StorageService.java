package com.writegy.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.async.AsyncRequestBody;
import software.amazon.awssdk.services.s3.S3AsyncClient;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Service
public class StorageService {

    @Autowired
    private S3AsyncClient s3AsyncClient;

    @Value("${cloudflare.r2.bucket-name}")
    private String bucketName;

    public String uploadFile(MultipartFile multipartFile) throws IOException, ExecutionException, InterruptedException {
        String fileName = System.currentTimeMillis() + "_" + multipartFile.getOriginalFilename();

        PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .contentType(multipartFile.getContentType())
                .build();

        // Convert MultipartFile to AsyncRequestBody
        AsyncRequestBody requestBody = AsyncRequestBody.fromBytes(multipartFile.getBytes());

        // Upload asynchronously and wait for completion
        CompletableFuture<Void> future = s3AsyncClient.putObject(putObjectRequest, requestBody)
                .thenAccept(response -> {
                    // Upload successful
                });

        // Wait for the upload to complete
        future.get();

        return fileName;
    }

    /**
     * Delete a file from S3/R2 storage.
     * Used for compensating transaction when database save fails after S3 upload.
     * 
     * @param fileName The file name/key to delete
     */
    public void deleteFile(String fileName) {
        if (fileName == null || fileName.isEmpty()) {
            return;
        }

        DeleteObjectRequest deleteObjectRequest = DeleteObjectRequest.builder()
                .bucket(bucketName)
                .key(fileName)
                .build();

        // Delete asynchronously - fire and forget for cleanup
        s3AsyncClient.deleteObject(deleteObjectRequest);
    }
}
