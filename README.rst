frontend-app-learning-paths
###########################

|license-badge| |status-badge| |ci-badge| |codecov-badge|

.. |license-badge| image:: https://img.shields.io/github/license/open-craft/frontend-app-learning-paths.svg
    :target: https://github.com/open-craft/frontend-app-learning-paths/blob/main/LICENSE
    :alt: License

.. |status-badge| image:: https://img.shields.io/badge/Status-Maintained-brightgreen

.. |ci-badge| image:: https://github.com/open-craft/frontend-app-learning-paths/actions/workflows/ci.yml/badge.svg
    :target: https://github.com/open-craft/frontend-app-learning-paths/actions/workflows/ci.yml
    :alt: Continuous Integration

.. |codecov-badge| image:: https://codecov.io/github/open-craft/frontend-app-learning-paths/coverage.svg?branch=main
    :target: https://codecov.io/github/open-craft/frontend-app-learning-paths?branch=main
    :alt: Codecov

Purpose
=======

The Learning Paths MFE provides a specialized frontend interface for managing and displaying
learning paths in Open edX. Learning paths are curated sequences of courses that guide learners
through a structured educational journey toward mastering specific skills or knowledge areas.

This MFE serves as the frontend for the learning-paths-plugin_, which provides the complete backend functionality.

.. _learning-paths-plugin: https://github.com/open-craft/learning-paths-plugin/

Getting Started
===============

Tutor Setup
-----------

Follow these steps to set up the Learning Paths MFE with Tutor:

#. Navigate to your Tutor plugins directory:

   .. code-block:: bash

      cd "$(tutor plugins printroot)"

#. Create a file named ``learning_paths.py`` with the following content:

   .. code-block:: python

      from tutormfe.hooks import MFE_APPS

      @MFE_APPS.add()
      def _add_learning_paths_mfe(mfes):
          mfes["learning-paths"] = {
              "repository": "https://github.com/open-craft/frontend-app-learning-paths.git",
              "port": 2100,
              "version": "main",  # optional, will default to the Open edX current tag
          }
          return mfes

#. Enable the plugin:

   .. code-block:: bash

      tutor plugins enable learning_paths

#. Build the MFE image:

   .. code-block:: bash

      tutor images build mfe

#. Restart the MFE container to apply changes:

   .. code-block:: bash

      tutor dev stop mfe && tutor dev start -d

#. Access the Learning Paths MFE at: http://apps.local.openedx.io:2100/learning-paths/

Development Setup
-----------------

After completing the Tutor setup, prepare the repository for local development:

#. Clone this repository:

   .. code-block:: bash

      git clone https://github.com/open-craft/frontend-app-learning-paths.git
      cd frontend-app-learning-paths

#. Create `.env.private` with the following content:

   .. code-block:: bash

      LMS_BASE_URL='http://local.openedx.io:8000'
      LOGIN_URL='http://local.openedx.io:8000/login'
      LOGOUT_URL='http://local.openedx.io:8000/logout'
      REFRESH_ACCESS_TOKEN_ENDPOINT='http://local.openedx.io:8000/login_refresh'
      TERMS_OF_SERVICE_URL='https://www.edx.org/edx-terms-service'
      PRIVACY_POLICY_URL='http://local.openedx.io:8000/privacy'

#. Install dependencies:

   .. code-block:: bash

      npm install

#. Mount the repository for development:

   .. code-block:: bash

      cd ..
      tutor mounts add $(pwd)/frontend-app-learning-paths

#. Restart the MFE container (to unbind the port) and start the MFEs:

   .. code-block:: bash

      tutor dev stop mfe && tutor dev start -d

#. Make changes to the code and see them reflected in real-time.

Local Development
-----------------

You can also run this MFE locally without mounting it in Tutor:

#. First, create a Tutor plugin to add CORS configuration:

   .. code-block:: bash

      cd "$(tutor plugins printroot)"

#. Create a file named ``learning_paths.py`` with the following content:

   .. code-block:: python

      from tutor import hooks

      hooks.Filters.ENV_PATCHES.add_item(
          (
              "openedx-lms-common-settings",
              'CORS_ORIGIN_WHITELIST.append("http://apps.local.openedx.io:2100")'
          )
      )

#. Enable the plugin:

   .. code-block:: bash

      tutor plugins enable learning_paths

#. Run the MFE locally:

   .. code-block:: bash

      cd frontend-app-learning-paths
      npm install
      npm run start:local

Getting Help
============

If you're having trouble, we have discussion forums at
https://discuss.openedx.org where you can connect with others in the community.

Our real-time conversations are on Slack. You can request a `Slack
invitation`_, then join our `community Slack workspace`_.  Because this is a
frontend repository, the best place to discuss it would be in the `#wg-frontend
channel`_.

For anything non-trivial, the best path is to open an issue in this repository
with as many details about the issue you are facing as you can provide.

https://github.com/open-craft/frontend-app-learning-paths/issues

For more information about these options, see the `Getting Help`_ page.

.. _Slack invitation: https://openedx.org/slack
.. _community Slack workspace: https://openedx.slack.com/
.. _#wg-frontend channel: https://openedx.slack.com/archives/C04BM6YC7A6
.. _Getting Help: https://openedx.org/getting-help

License
=======

The code in this repository is licensed under the AGPLv3 unless otherwise
noted.

Please see `LICENSE <LICENSE>`_ for details.

Contributing
============

Contributions are very welcome.  Please read `How To Contribute`_ for details.

.. _How To Contribute: https://openedx.org/r/how-to-contribute

This project is currently accepting all types of contributions, bug fixes,
security fixes, maintenance work, or new features.  However, please make sure
to have a discussion about your new feature idea with the maintainers prior to
beginning development to maximize the chances of your change being accepted.
You can start a conversation by creating a new issue on this repo summarizing
your idea.

The Open edX Code of Conduct
============================

All community members are expected to follow the `Open edX Code of Conduct`_.

.. _Open edX Code of Conduct: https://openedx.org/code-of-conduct/

People
======

The assigned maintainers for this component and other project details may be
found in `Backstage`_. Backstage pulls this data from the ``catalog-info.yaml``
file in this repo.

.. _Backstage: https://open-edx-backstage.herokuapp.com/catalog/default/component/frontend-app-learning-paths

Reporting Security Issues
=========================

Please do not report security issues in public.  Email security@openedx.org instead.
