# encryptsync (UNDER CONSTRUCTION)
This package allows users to sync a _source_ folder with a _target_ one while encrypting the files in between using gpg. 

_encryptsync_ allows security-conscious users to encrypt their file  prior to uploading them in places like _Dropbox_ and _Google Drive_.

The package does NOT implement any security layer itself; it relies completely on 
GPG for that task.

The package has been tested only on Ubuntu thus far and provides no guarantees.

## Future work
1. Allow the server to compare source and target folders when initialized. 
2. Extend the tool to allow for the decryption of data as well, sync source and target folders in both directions.