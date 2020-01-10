#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sat Jan 11 01:08:36 2020

@author: guilom
"""
import serial
stop = False
with serial.Serial('/dev/ttyS0', 9600) as serial_port:
    while not stop:
        line = serial_port.read()   # read
        print(line)
        if line == "stop\n":
            stop = True