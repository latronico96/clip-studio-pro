package video

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"
)

func CutVideo(input string, start float64, end float64, layoutMode string) (string, error) {
	// ===== Validaciones =====
	if input == "" {
		return "", fmt.Errorf("input video is required")
	}

	if start < 0 || end <= start {
		return "", fmt.Errorf("invalid time range: start=%f end=%f", start, end)
	}

	absInput, err := filepath.Abs(input)
	if err != nil {
		return "", err
	}

	dir := filepath.Dir(absInput)
	base := filepath.Base(absInput)
	ext := filepath.Ext(base)
	name := base[:len(base)-len(ext)]

	output := filepath.Join(dir, name+"_cut.mp4")

	// ===== Video filter según layout =====
	var videoFilter string

	switch layoutMode {
	case "portrait-crop":
		videoFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920"
	case "portrait-fit":
		videoFilter = "scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2"
	case "landscape", "":
		videoFilter = ""
	default:
		return "", fmt.Errorf("unknown layout mode: %s", layoutMode)
	}

	// ===== Context =====
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	// ===== Args ffmpeg =====
	args := []string{
		"-y",
		"-ss", fmt.Sprint(start),
		"-to", fmt.Sprint(end),
		"-i", absInput,
	}

	if videoFilter != "" {
		args = append(args, "-vf", videoFilter)
	}

	args = append(args,
		"-map", "0:v:0?",
		"-map", "0:a:0?",
		"-c:v", "libx264",
		"-preset", "veryfast",
		"-crf", "23",
		"-pix_fmt", "yuv420p",
		"-c:a", "aac",
		"-b:a", "128k",
		"-movflags", "+faststart",
		output,
	)

	cmd := exec.CommandContext(ctx, "ffmpeg", args...)

	if err := cmd.Run(); err != nil {
		if ctx.Err() != nil {
			return "", fmt.Errorf("ffmpeg timed out")
		}
		return "", fmt.Errorf("ffmpeg failed: %w", err)
	}

	if _, err := os.Stat(output); err != nil {
		return "", fmt.Errorf("output file not created")
	}

	return output, nil
}
