# check runs format, build and lint checks
# it includes any auto-fixers that are enabled
# it will exit non-zero if any issues are found OR if 
# any auto-fixers modified files. If it fails because
# of auto-fixers, it may pass on the next run.
.PHONY: check 
check:
	# fill me out


# test runs the tests
# it should be run frequently during development
.PHONY: test
test:
	# fill me out

# run should build+run the server IN THE BACKGROUND
# if the server is already running, it should restart or kill the old process
.PHONY: run
run:
	# fill me out