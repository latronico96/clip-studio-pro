package video

import (
	"context"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func UploadResult(path string, backendUrl string) (string, error) {
	if path == "" {
		return "", fmt.Errorf("path is required")
	}
	if backendUrl == "" {
		return "", fmt.Errorf("backendUrl is required")
	}

	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	pr, pw := io.Pipe()
	writer := multipart.NewWriter(pw)
	errCh := make(chan error, 1)

	go func() {
		defer pw.Close()
		defer writer.Close()

		part, err := writer.CreateFormFile("file", filepath.Base(path))
		if err != nil {
			errCh <- err
			return
		}

		if _, err := io.Copy(part, file); err != nil {
			errCh <- err
			return
		}

		errCh <- nil
	}()

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	req, err := http.NewRequest(
		"POST",
		backendUrl+"/api/internal/upload",
		pr,
	)
	if err != nil {
		return "", err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 2 * time.Minute}
	res, err := client.Do(req.WithContext(ctx))
	if err != nil {
		return "", err
	}
	defer res.Body.Close()

	if err := <-errCh; err != nil {
		return "", err
	}

	if res.StatusCode >= 300 {
		return "", fmt.Errorf("upload failed: %s", res.Status)
	}

	body, _ := io.ReadAll(res.Body)
	return string(body), nil
}
