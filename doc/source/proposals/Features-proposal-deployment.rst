====================
Automatic Deployment
====================

Whenever a new release is ready it should be deployed so that the interested persons are able to
access the application. Right now, the deployment is a manual, error prone process. This proposal
shows how this process can be automated. The deployment process must easy support rollback to
previous versions if something goes wrong.

--------
Why Git?
--------

Git is an open source distributed version control system designed to handle everything from small to
very large projects with speed and efficiency. The data model that Git uses ensures the cryptographic
integrity of every bit of your project. Every file and commit is checksummed and retrieved by its
checksum when checked back out. It's impossible to get anything out of Git other than the exact bits
you put in.

In the deployment process, Git will be used as a transport for the files that needs to be deployed.
The main advantages of using Git instead of simply copying the files are:

 * faster deployment, only the changes since the last release are transfered
 * it ensures the integrity of the deployment
 * the ability to track what was deployed and when. Having this information allows the rollback to a
   previous version by simply retrieving the tag associated with the release.

Git needs to be installed on each machine that will be used to deploy the application. Two repositories
will be created: a bare repository that will act as a server (new releases will be pushed to this
repository) and a normal repository that will contain the working copy.

---------------
Deployment Flow
---------------

A deploy is triggered by executing the deploy command located in the RAIN SDK in the folder that
contains the project that needs to be deployed. The deployment configurations will be located in
the *package.json* file::

    // ...
    "deployment": {
        "server1": {
            "url": "user@server1:/path/to/repo"
        },
        "server2": {
            "url": "user@server2:/path/to/repo"
        }
    }
    
The server on which to deploy is specified by passing the configuration key as a command line
argument to the deploy command::
    
    rain deploy server1
    
When executed, this command will push the changes from the local repository to the repository
specified in the configuration (this is the bare repository located on the server).

The bare repository has a ``post-receive`` hook which is run after the push process finished and
executes the following operations:

 #. updates the files in the normal repository by pulling from the bare repository
 #. creates a tag on the last commit to mark the point in history corresponding to the current
    deploy
 #. runs a build script located in the project directory (this will be used to add actions like
    building the documentation, running the unit tests etc.)
 #. starts the rain server
 #. if one of the last two steps fails, reverts the state of the working copy to the last successful
    deploy (this is done by reverting to the most recent tag that was deployed without errors) and
    marks the tag associated with the current deploy as a failure.
