# EncryptSync
v0.2.10

This package allows users to sync a _source_ folder with a _target_ one while encrypting the files using GNU Privacy Guard (GPG). The package does ***NOT*** implement any encryption layer itself!

_EncryptSync_ watches the _source_ folder and whenever a file changes it encrypts the changed file using a public GPG key and saves in the _target_ folder. If the _target_ folder is _Dropbox_ and _Google Drive_, for instance, the encrypted version will be backed up in the cloud.

The package has been tested only on **Ubuntu** and provides no guarantees.

## Limitations
Currently, if a an encrypted file changed in the _target_ folder _EncryptSync_ will not decrypt it and save in the _source_ folder. Basically, the flow of data is only from source to target at the moment.

## Dependencies
* [Node.js](https://nodejs.org/en/download/) >= 18
* [GPG](https://gnupg.org/)


## Install
1. Download the latest build from [here](https://bitbucket.org/vnl2k/encryptsync/raw/098ff1fda5edede0e725e8cbca0a1dc8b3a09e77/build/encryptsync_v0.2.10.zip)
2. Unzip the archive.
3. Run

    `chmod u+x /path/to/install-encryptsync`
    
    `./install-encryptsync --register-app`

    The script will register the app with Ubuntu and add an executable for it in Desktop folder.

4. Create a daemon
    `sudo ln -sf /full/path/to/encrypt-sync.service /etc/systemd/system`

5. Configuration
   WIP: The tool looks for `.encryptsyncrc` file in the home directory, i.e. `~/`. If that fails it searches for it in the repository folder. The file uses JSON format and looks like this:

```
{
  "source_path": "/path/to/source/folder",
  "target_path": "/path/to/target/folder",
  "email" : "email.address@for.gpg.key"
}
```
    You need to edit accordingly the fields in it.

## Run in CLI mode
In case you prefer running monitor using the command line there are two options:

* specify the path for the configuration file: `./start-encryptsync --config /absolute/path/to/config`
* specify the configuration information directly: `./start-encryptsync --target /absolute/path/to/target --source /absolute/path/to/source --email test@example.com`

In the second case the logs file, _.encryptsyncLog_, will be located in the same folder as `start-encryptsync`. Otherwise it will be in the same folder as the configuration file.

### GPG encryption
In order to generate a public-private key pair for GPG follow this [guide](https://www.gnupg.org/gph/en/manual.html#AEN26). It all begins with `gpg --gen-key` and the you follow the wizard.

How-to guide from GitHub on creating new key pair is also available [here](https://help.github.com/en/github/authenticating-to-github/generating-a-new-gpg-key).

## Future work
0. Add wizard to generate the _rc_ config file.
1. Add **CLI**/GUI allowing decryption of all or part of the data; possibly allow syncing encrypted files back.
2. Allow the server to compare source and target folders when initialized:
    * one way of doing that would be to add a hash for each file to the encrypted file name?  
3. Extend the tool to allow for the decryption of data as well, sync source and target folders in both directions.
4. Add support for the following encryption packages
    * https://www.pq-crystals.org/kyber (https://openquantumsafe.org/)