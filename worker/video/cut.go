package video

import (
	"context"
	"fmt"
	"os/exec"
	"path/filepath"
	"time"
)

func CutVideo(input string, start, end int) (string, error) {
	if input == "" {
		return "", fmt.Errorf("input video is required")
	}
	if start < 0 || end <= start {
		return "", fmt.Errorf("invalid time range: start=%d end=%d", start, end)
	}

	output := filepath.Join(input)
	
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	cmd := exec.CommandContext(
		ctx,
		"ffmpeg",
		"-y",
		"-ss", fmt.Sprint(start),
		"-to", fmt.Sprint(end),
		"-i", input,
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-crf", "23",
		"-c:a", "aac",
		"-b:a", "128k",
		"-pix_fmt", "yuv420p",
		"-movflags", "+faststart",
		output,
	)

	if err := cmd.Run(); err != nil {
		if ctx.Err() != nil {
			return "", fmt.Errorf("ffmpeg timed out: %w", ctx.Err())
		}
		return "", fmt.Errorf("ffmpeg failed: %w", err)
	}

	return output, nil
}
