package video

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

func DownloadYoutube(videoID string, _ string) (string, error) {
	if videoID == "" {
		return "", fmt.Errorf("videoID is required")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	tmpDir := os.TempDir()
	if err := os.MkdirAll(tmpDir, 0o755); err != nil {
		return "", fmt.Errorf("ensure temp dir: %w", err)
	}

	output := filepath.Join(tmpDir, videoID+".mp4")

	cmd := exec.CommandContext(
		ctx,
		"yt-dlp",
		"-f", "mp4/best",
		"-o", output,
		"https://www.youtube.com/watch?v="+videoID,
	)

	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		if ctx.Err() == context.DeadlineExceeded {
			return "", fmt.Errorf("youtube download timed out")
		}
		return "", fmt.Errorf("youtube download failed: %w", err)
	}

	if _, err := os.Stat(output); err != nil {
		return "", fmt.Errorf("download finished but file not found")
	}

	return output, nil
}
