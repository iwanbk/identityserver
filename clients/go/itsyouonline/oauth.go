package itsyouonline

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

// LoginWithClientCredentials login to itsyouonline using the client ID and client secret.
// If succeed:
//	- returns the oauth2 access token
//  - set AuthHeader to `token TOKEN_VALUE`.
func (c *Itsyouonline) LoginWithClientCredentials(clientID, clientSecret string) (string, error) {
	// build request
	req, err := http.NewRequest("POST", rootURL+"/v1/oauth/access_token", nil)
	if err != nil {
		return "", err
	}

	// request query params
	qs := map[string]interface{}{
		"grant_type":    "client_credentials",
		"client_id":     clientID,
		"client_secret": clientSecret,
	}
	q := req.URL.Query()
	for k, v := range qs {
		q.Add(k, fmt.Sprintf("%v", v))
	}
	req.URL.RawQuery = q.Encode()

	// do the request
	rsp, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer rsp.Body.Close()

	if rsp.StatusCode != 200 {
		return "", fmt.Errorf("invalid response's status code :%v", rsp.StatusCode)
	}

	// decode
	var jsonResp map[string]interface{}
	if err := json.NewDecoder(rsp.Body).Decode(&jsonResp); err != nil {
		return "", err
	}
	val, ok := jsonResp["access_token"]
	if !ok {
		return "", fmt.Errorf("no token found")
	}

	token := fmt.Sprintf("%v", val)

	c.AuthHeader = "token " + token

	return token, nil

}

// CreateJWTToken creates JWT token with scope=scopes
// and audience=auds.
// To execute it, client need to be logged in.
func (c *Itsyouonline) CreateJWTToken(scopes, auds []string) (string, error) {
	// build request
	req, err := http.NewRequest("GET", rootURL+"/v1/oauth/jwt", nil)
	if err != nil {
		return "", err
	}

	// set auth header
	if c.AuthHeader == "" {
		return "", fmt.Errorf("you need to create oauth token in order to create JWT token")
	}

	req.Header.Set("Authorization", c.AuthHeader)

	// query params
	q := req.URL.Query()
	if len(scopes) > 0 {
		q.Add("scope", strings.Join(scopes, ","))
	}
	if len(auds) > 0 {
		q.Add("aud", strings.Join(auds, ","))
	}
	req.URL.RawQuery = q.Encode()

	// do the request
	rsp, err := c.client.Do(req)
	if err != nil {
		return "", err
	}
	defer rsp.Body.Close()

	if rsp.StatusCode != 200 {
		return "", fmt.Errorf("invalid response's status code :%v", rsp.StatusCode)
	}

	b, err := ioutil.ReadAll(rsp.Body)
	if err != nil {
		return "", err
	}
	return string(b), nil
}
