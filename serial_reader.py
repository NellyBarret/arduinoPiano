#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Sat Jan 11 01:08:36 2020

@author: guilom
"""
from time import sleep

import serial
import socket
import random
import select

hote = "localhost"
port = 15555

socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
socket.connect((hote, port))


stop = False

with serial.Serial('/dev/cu.usbmodem142401', 9600) as serial_port:
    while not stop:
        if serial_port.inWaiting() > 0:
            b = serial_port.read()
            socket.send(b)

        ready = select.select([socket], [], [], 0.001)
        if ready[0]:
            response = socket.recv(1)
            serial_port.write(response)

'''
to_send = [1,2,3,4,5,6,7,7,6,5,4,3,2,1]
b = 0
while not stop:
    if b < len(to_send):
        socket.send(str(to_send[b]).encode('utf-8'))
    b+=1
    sleep(0.2)
'''