package main

import (
	"io/ioutil"
	"os"

	log "github.com/Sirupsen/logrus"
	"github.com/codegangsta/cli"

	"github.com/itsyouonline/identityserver/communication"
	"github.com/itsyouonline/identityserver/db"
	"github.com/itsyouonline/identityserver/globalconfig"
	"github.com/itsyouonline/identityserver/https"
	"github.com/itsyouonline/identityserver/identityservice"
	"github.com/itsyouonline/identityserver/oauthservice"
	"github.com/itsyouonline/identityserver/routes"
	"github.com/itsyouonline/identityserver/siteservice"
)

func main() {

	app := cli.NewApp()
	app.Name = "Identity server"
	app.Version = "0.1-Dev"

	log.SetFormatter(&log.TextFormatter{FullTimestamp: true})

	var debugLogging, ignoreDevcert bool
	var bindAddress, dbConnectionString string
	var tlsCert, tlsKey string
	var twilioAccountSID, twilioAuthToken, twilioMessagingServiceSID string

	app.Flags = []cli.Flag{
		cli.BoolFlag{
			Name:        "debug, d",
			Usage:       "Enable debug logging",
			Destination: &debugLogging,
		},
		cli.StringFlag{
			Name:        "bind, b",
			Usage:       "Bind address",
			Value:       ":8443",
			Destination: &bindAddress,
		},
		cli.StringFlag{
			Name:        "connectionstring, c",
			Usage:       "Mongodb connection string",
			Value:       "127.0.0.1:27017",
			Destination: &dbConnectionString,
		},
		cli.StringFlag{
			Name:        "cert, s",
			Usage:       "TLS certificate path",
			Value:       "",
			Destination: &tlsCert,
		},
		cli.StringFlag{
			Name:        "key, k",
			Usage:       "TLS private key path",
			Value:       "",
			Destination: &tlsKey,
		},
		cli.BoolFlag{
			Name:        "ignore-devcert, i",
			Usage:       "Ignore default devcert even if exists",
			Destination: &ignoreDevcert,
		},
		cli.StringFlag{
			Name:        "twilio-AccountSID",
			Usage:       "Twilio AccountSID",
			Destination: &twilioAccountSID,
		},
		cli.StringFlag{
			Name:        "twilio-AuthToken",
			Usage:       "Twilio AuthToken",
			Destination: &twilioAuthToken,
		},
		cli.StringFlag{
			Name:        "twilio-MsgSvcSID",
			Usage:       "Twilio MessagingServiceSID",
			Destination: &twilioMessagingServiceSID,
		},
	}

	app.Before = func(c *cli.Context) error {
		if debugLogging {
			log.SetLevel(log.DebugLevel)
			log.Debug("Debug logging enabled")
			log.Debug(app.Name, "-", app.Version)
		}
		return nil
	}

	app.Action = func(c *cli.Context) {
		// Connect to DB!
		go db.Connect(dbConnectionString)
		defer db.Close()

		cookieSecret := identityservice.GetCookieSecret()
		var smsService *communication.SMSService
		if twilioAccountSID != "" {
			smsService = &communication.SMSService{
				AccountSID:          twilioAccountSID,
				AuthToken:           twilioAuthToken,
				MessagingServiceSID: twilioMessagingServiceSID,
			}
		}
		sc := siteservice.NewService(cookieSecret, smsService)
		is := identityservice.NewService()

		config := globalconfig.NewManager()

		//TODO: fall back on devkey when not present
		var jwtKey []byte
		var err error
		exists, err := config.Exists("jwtkey")
		if err == nil && exists {
			var jwtKeyConfig *globalconfig.GlobalConfig
			jwtKeyConfig, err = config.GetByKey("jwtkey")
			jwtKey = []byte(jwtKeyConfig.Value)
		} else {
			if err == nil {
				if _, err := os.Stat("devcerts/jwt_key.pem"); err == nil {
					log.Warning("===============================================================================")
					log.Warning("This instance uses a development JWT signing key, don't do this in production !")
					log.Warning("===============================================================================")

					jwtKey, err = ioutil.ReadFile("devcerts/jwt_key.pem")
				}
			}
		}

		if err != nil {
			log.Fatal("Unable to load a valid key for signing JWT's: ", err)
		}
		oauthsc, err := oauthservice.NewService(sc, is, jwtKey)
		if err != nil {
			log.Fatal("Unable to create the oauthservice: ", err)
		}
		// Get router!
		r := routes.GetRouter(sc, is, oauthsc)

		server := https.PrepareHTTP(bindAddress, r)
		https.PrepareHTTPS(server, tlsCert, tlsKey, ignoreDevcert)

		// Go make magic over HTTPS
		log.Info("Listening (https) on ", bindAddress)
		log.Fatal(server.ListenAndServeTLS("", ""))
	}

	app.Run(os.Args)
}
