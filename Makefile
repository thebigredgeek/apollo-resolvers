
PATH := node_modules/.bin:$(PATH)
SHELL := /bin/bash

NODE ?= $(shell which node)
YARN ?= $(shell which yarn)
PKG ?= $(if $(YARN),$(YARN),$(NODE) $(shell which npm))

.PHONY:

all: clean .PHONY
	tsc

configure: .PHONY
	@NODE_ENV= $(PKG) install

lint: .PHONY
	eslint src test

clean: .PHONY
	rimraf dist

test: .PHONY
	mocha
