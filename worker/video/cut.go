package video

import (
	"fmt"
	"os/exec"
	"path/filepath"
)

func CutVideo(input string, start, end int) (string, error) {
	output := filepath.Join("/tmp", "clip-"+filepath.Base(input))

	cmd := exec.Command(
		"ffmpeg",
		"-y",
		"-i", input,
		"-ss", fmt.Sprint(start),
		"-to", fmt.Sprint(end),
		"-c", "copy",
		output,
	)

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("ffmpeg failed: %w", err)
	}

	return output, nil
}
