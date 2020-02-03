# EncryptSync
v0.2.9

This package allows users to sync a _source_ folder with a _target_ one while encrypting the files using GNU Privacy Guard (GPG). The package does ***NOT*** implement any encryption layer itself!

_EncryptSync_ watches the _source_ folder and whenever a file changes it encrypts the changed file using a public GPG key and saves in the _target_ folder. If the _target_ folder is _Dropbox_ and _Google Drive_, for instance, the encrypted version will be backed up in the cloud.

The package has been tested only on **Ubuntu** and provides no guarantees.

## Limitations
Currently, if a an encrypted file changed in the _target_ folder _EncryptSync_ will not decrypt it and save in the _source_ folder. Basically, the flow of data is only from source to target at the moment.

## Dependencies
* Node.js >= 12
* [GPG](https://gnupg.org/)


## Install
1. Download the latest build from [here](https://bitbucket.org/vnl2k/encryptsync/src/master/build/encryptsync_v0.2.9.zip)
2. Unzip the archive.
3. Run
    ```bash
        chmod +x /path/to/start-encryptsync
        start-encryptsync --register-app
    ```
    The script with register the app with Ubuntu and add an executable for it in the Desktop folder.
4. Configuration
    The tool looks for `.encryptsyncrc` file in the home directory, i.e. `~/`. If that fails it searches for it in the repository folder. The file uses JSON format and looks like this:
    ```json
    {
        "source_path": "/path/to/source/folder",
        "target_path": "/path/to/target/folder",
        "options": {
            "email" : "email.address@for.gpg.key"
        }
    }
    ```

## Future work
1. Allow the server to compare source and target folders when initialized:
    * one way of doing that would be to add a hash for each file to the encrypted file name?  
2. Extend the tool to allow for the decryption of data as well, sync source and target folders in both directions.
3. Add support for the following encryption packages
    * https://gopenpgp.org/ (https://protonmail.com/blog/openpgp-golang/)
    * https://www.pq-crystals.org/kyber (https://openquantumsafe.org/)