# Inline comments checklist

To make utterances inline commenting system work following is necessary

1. Create repository to host the issues

2. Create personal access token

3. Create GitHub OAuth application

4. Configure and host an instance of utterances-oauth web application

5. Configure and compile the utterances client script

6. Reference client script on a page with a script tag

## 1. Create repository to host the issues
* Create a new repository on github
* Go to repository settings and under **Features** check the **Issues** checkbox
* add **utterances.json** file to the repo with following content
```
  {
    "origins": [ WEBAPP_HOSTNAME ]
  }
```

`WEBAPP_HOSTNAME` is the hostname of the site which hosts the client script.

## 2. Create personal access token
Personal access token is necessary to configure utterances-oauth we application

* Click your profile icon on github, choose **Settings**
* On profile page choose **Developer settings**
* Select Personal access tokens
* Click Generate new token
* Type appropriate name
* Under **Select scopes** check **public_repo**

## 3. Create GitHub OAuth application
* Click your profile icon on github, choose **Settings**
* On profile page choose **Developer settings**
* OAuth Apps is selected by default
* Create a new OAuth app
  * Type appropriate application name
  * Type homepage url
  * Type appropriate application description
  * Type authorization callback URL
     * This callback URL should end with /authorized because utterances-oauth web application listens for callbacks on that URL
  * Click Register Application
  * Note the Client ID and Client Secret because they are necessary to configure utterances-oauth application

## 4. Configure and host an instance of utterances-oauth web application
* install nodejs because utterances-oauth is a nodejs application
* clone [https://github.com/utterance/utterances-oauth](https://github.com/utterance/utterances-oauth)
* Follow instructions and explanations from [readme](https://github.com/utterance/utterances-oauth)
* for `BOT_TOKEN` use personal access token created at **step 2**
* for `CLIENT_ID` and `CLIENT_SECRET` use values created at **step 3**
* value for `APP_ROOT` is used to fill the **authorization callback URL** in **step 3**
* use npm run start-env to host an application instance

## 5. Configure and compile the utterances client script
* Clone [https://github.com/IntranetFactory/utterances](https://github.com/IntranetFactory/utterances) into local folder
* run npm install
* under src folder find the utterances-api.ts file
* change the value of `const UTTERANCES_API` to be the value of `APP_ROOT` from **step 4**
* run npm build
* go to dist folder to grab the files ready for production

## 6.Reference client script on a page with a script tag
On the desired page place the script tag as follows

```
  <script src="<path-to>/client.js"
        repo="username/repository-name"
        branch="master"
        issue-term="pathname"
        async>
  </script>
```

