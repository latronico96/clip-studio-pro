package video

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"
)

func DownloadYoutube(videoID string, accessToken string) (string, error) {
	if videoID == "" {
		return "", fmt.Errorf("videoID is required")
	}

	if accessToken == "" {
		return "", fmt.Errorf("youtube access token is required to download videos via the YouTube API")
	}

	client := &http.Client{Timeout: 60 * time.Second}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
	defer cancel()

	if err := ensureVideoAccess(ctx, client, accessToken, videoID); err != nil {
		return "", err
	}

	output := filepath.Join("/tmp", videoID+".mp4")
	if err := downloadVideo(ctx, client, accessToken, videoID, output); err != nil {
		return "", err
	}

	return output, nil
}

type youtubeVideoListResponse struct {
	Items []struct {
		ID string `json:"id"`
	} `json:"items"`
}

type youtubeAPIError struct {
	Error struct {
		Code    int    `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

func ensureVideoAccess(ctx context.Context, client *http.Client, accessToken, videoID string) error {
	endpoint := "https://www.googleapis.com/youtube/v3/videos"
	query := url.Values{}
	query.Set("part", "id")
	query.Set("id", videoID)

	requestURL := endpoint + "?" + query.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return fmt.Errorf("create video lookup request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("video lookup failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("read video lookup response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return parseYouTubeError("video lookup", resp.StatusCode, body)
	}

	var listResponse youtubeVideoListResponse
	if err := json.Unmarshal(body, &listResponse); err != nil {
		return fmt.Errorf("decode video lookup response: %w", err)
	}

	if len(listResponse.Items) == 0 {
		return fmt.Errorf("video %s not found or not accessible with the provided token", videoID)
	}

	return nil
}

func downloadVideo(ctx context.Context, client *http.Client, accessToken, videoID, output string) error {
	endpoint := "https://www.googleapis.com/youtube/v3/videos"
	query := url.Values{}
	query.Set("id", videoID)
	query.Set("alt", "media")

	requestURL := endpoint + "?" + query.Encode()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, requestURL, nil)
	if err != nil {
		return fmt.Errorf("create download request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("download request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, readErr := io.ReadAll(resp.Body)
		if readErr != nil {
			return fmt.Errorf("download failed with status %s and could not read body: %w", resp.Status, readErr)
		}
		return parseYouTubeError("download", resp.StatusCode, body)
	}

	file, err := os.Create(output)
	if err != nil {
		return fmt.Errorf("create output file: %w", err)
	}
	defer file.Close()

	if _, err := io.Copy(file, resp.Body); err != nil {
		_ = os.Remove(output)
		return fmt.Errorf("write output file: %w", err)
	}

	return nil
}

func parseYouTubeError(action string, statusCode int, body []byte) error {
	var apiErr youtubeAPIError
	if err := json.Unmarshal(body, &apiErr); err == nil && apiErr.Error.Message != "" {
		return fmt.Errorf("youtube api %s failed: %s (status %d)", action, apiErr.Error.Message, statusCode)
	}

	return fmt.Errorf("youtube api %s failed with status %d", action, statusCode)
}
