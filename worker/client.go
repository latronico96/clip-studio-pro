package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"time"
)

type ClaimResponse struct {
	Job *Job `json:"job"`
}

type BackendClient struct {
	baseURL  string
	token    string
	workerID string
	client   *http.Client
}

func NewBackendClient(cfg Config) *BackendClient {
	return &BackendClient{
		baseURL:  cfg.BackendURL,
		token:    cfg.WorkerToken,
		workerID: cfg.WorkerID,
		client:   &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *BackendClient) auth(req *http.Request) {
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("x-worker-id", c.workerID)
}

func (c *BackendClient) FetchNextJob() (*Job, error) {
	req, err := http.NewRequest(
		"POST",
		c.baseURL+"/api/internal/jobs/claim",
		nil,
	)
	if err != nil {
		return nil, err
	}

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()

	var resp ClaimResponse
	if err := json.NewDecoder(res.Body).Decode(&resp); err != nil {
		return nil, err
	}

	if resp.Job == nil {
		return nil, nil
	}

	return resp.Job, nil
}

func (c *BackendClient) UpdateJobStatus(jobID string, status string) error {
	body, _ := json.Marshal(map[string]string{
		"status": status,
	})

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/status", c.baseURL, jobID),
		bytes.NewBuffer(body),
	)
	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	return nil
}

func (c *BackendClient) CompleteJob(jobID string, result any, workerID string) error {
	if jobID == "" {
		return fmt.Errorf("jobID is empty")
	}

	log.Println("[WORKER] Completing job:", jobID)

	body, _ := json.Marshal(map[string]any{
		"status": "COMPLETED",
		"result": result,
	})

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/complete", c.baseURL, jobID),
		bytes.NewBuffer(body),
	)

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		b, _ := io.ReadAll(res.Body)
		return fmt.Errorf("complete failed: %s - %s", res.Status, string(b))
	}

	return nil
}

func (c *BackendClient) FailJob(jobID string, err error) error {
	body, _ := json.Marshal(map[string]any{
		"status": "FAILED",
		"error":  err.Error(),
	})

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/complete", c.baseURL, jobID),
		bytes.NewBuffer(body),
	)

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		return fmt.Errorf("fail failed: %s", res.Status)
	}

	return nil
}

func (c *BackendClient) Heartbeat(jobID string, workerID string) error {

	req, _ := http.NewRequest(
		"POST",
		fmt.Sprintf("%s/api/internal/jobs/%s/heartbeat", c.baseURL, jobID),
		nil,
	)

	c.auth(req)

	res, err := c.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()

	if res.StatusCode >= 300 {
		return fmt.Errorf("heartbeat failed: %s", res.Status)
	}

	return nil
}
