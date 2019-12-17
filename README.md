# encryptsync (UNDER CONSTRUCTION)
This package allows users to sync a _source_ folder with a _target_ one while encrypting the files in between using GPG or RSA. 

For instance _encryptsync_ allows users to encrypt a file  prior to copying it to a _Dropbox_ and _Google Drive_ folder.

The package does NOT implement any security layer itself! It relies completely on established libraries for that.

The package has been tested only on Ubuntu and provides no guarantees.

## Future work
1. Allow the server to compare source and target folders when initialized:
    * one way of doing that would be to add a hash for each file to the encrypted file name?  
2. Extend the tool to allow for the decryption of data as well, sync source and target folders in both directions.
3. Add support for the following encryption packages
    * https://gopenpgp.org/ (https://protonmail.com/blog/openpgp-golang/)
    * https://www.pq-crystals.org/kyber (https://openquantumsafe.org/)