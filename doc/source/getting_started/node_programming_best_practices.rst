===============================
Node programming best practices
===============================

One important thing to remember is that Node shouldn't be used for all kind of applications. For
some types of applications you can say no from the start and for others you should have an
informed decision before starting the project.

This article describes some basic guidelines for how and what you should use Node. The list of
practices will be extended over time because Node is a relatively new technology and it didn't
fully defined them.

---------
Should do
---------

- Test your code. Node's event-driven, non-blocking I/O model and the error stack traces that
  aren't always very explicit make it hard to detect bugs and tests will be very useful.

- Separate your configuration settings into a config file and use different settings for Production
  and Development environments.

- Accept the fact that processes die, log the error stack trace and use scripts that automatically
  restart the server.

- When throwing errors provide explicit and meaningful error messages.

- When doing filesystem operations like reading a file or getting the stats information, always
  check in the callback if an error occurred before using the data.

- For asynchronous code the callback should always have the "err" parameter as the first parameter.
  If an error occurs the "err" is the error, otherwise it is "null". For synchronous code, if an
  error occurs, throw an error.

- Avoid as much as possible the use of nested callbacks.

- When you have a function that behaves both synchronous and asynchronous, use "process.nextTick"
  to make it asynchronous in all cases.

------------
Shouldn't do
------------

- Don't use Node for CPU intensive applications that block the thread.
