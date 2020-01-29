#!/usr/bin/env python
import time
import eventlet
import socket
from magenta.models.melody_rnn import melody_rnn_sequence_generator
from magenta.models.shared import sequence_generator_bundle
from magenta.music.protobuf import generator_pb2
from magenta.music.protobuf import music_pb2
import select

eventlet.monkey_patch()

from flask import Flask, render_template
from flask_socketio import SocketIO
import random

app = Flask(__name__)
socketio = SocketIO(app)


def generate_next():
    # Initialize the model.
    current_user_sequence.total_time = 8
    current_user_sequence.tempos.add(qpm=60)

    print("Initializing Melody RNN...")
    bundle = sequence_generator_bundle.read_bundle_file('basic_rnn.mag')
    generator_map = melody_rnn_sequence_generator.get_generator_map()
    melody_rnn = generator_map['basic_rnn'](checkpoint=None, bundle=bundle)
    melody_rnn.initialize()

    print('🎉 Done!')

    input_sequence = current_user_sequence  # change this to teapot if you want
    num_steps = 128  # change this for shorter or longer sequences
    temperature = 1.0  # the higher the temperature the more random the sequence.

    # Set the start time to begin on the next step after the last note ends.
    last_end_time = (max(n.end_time for n in input_sequence.notes)
                     if input_sequence.notes else 0)
    qpm = input_sequence.tempos[0].qpm
    seconds_per_step = 60.0 / qpm / melody_rnn.steps_per_quarter
    total_seconds = num_steps * seconds_per_step

    generator_options = generator_pb2.GeneratorOptions()
    generator_options.args['temperature'].float_value = temperature
    generate_section = generator_options.generate_sections.add(
        start_time=last_end_time + seconds_per_step,
        end_time=total_seconds)

    # Ask the model to continue the sequence.
    sequence = melody_rnn.generate(input_sequence, generator_options)
    toplay = sequence.notes[len(current_user_sequence.notes):]
    return toplay
    # return sequence.notes


waiting_time = 0
start_next_time = 0
sequence = 0
already_generated = 0

not_played_notes = []
not_stopped_notes = []

start_time = time.time()

current_user_sequence = music_pb2.NoteSequence()


button_to_pitch = {
    '1': '60',
    '2': '62',
    '3': '64',
    '4': '65',
    '5': '67',
    '6': '69',
    '7': '70',
}

pitch_to_button = {v: k for k, v in button_to_pitch.items()}

pressed = {}


def bg_emit(socket_arduino):
    global sequence
    global already_generated
    global not_stopped_notes
    global not_played_notes
    global start_next_time

    # note = str(random.randint(60, 69))
    if already_generated == 0:
        sequence = generate_next()
        already_generated = 1
        start_next_time = time.time() - current_user_sequence.notes[-1].end_time
        print("Generated current : ", start_next_time, sequence[0])
        not_played_notes = sequence
        not_stopped_notes = []

    elapsed_time = time.time() - start_next_time

    stop = False
    while not stop:
        if not not_stopped_notes:
            break
        n = not_stopped_notes[0]
        if n.end_time < elapsed_time:
            print("Emit : ", n.pitch, n.start_time, elapsed_time)
            socketio.emit('message', n.pitch)
            if str(n.pitch) in pitch_to_button:
                socket_arduino.send(pitch_to_button[str(n.pitch)].encode('utf-8'))
            not_stopped_notes.pop(0)
        stop = True

    stop = False
    while not stop:
        if not not_played_notes:
            break
        n = not_played_notes[0]
        if n.start_time < elapsed_time:
            print("Emit : ", n, elapsed_time)
            socketio.emit('message', n.pitch)
            if str(n.pitch) in pitch_to_button:
                socket_arduino.send(pitch_to_button[str(n.pitch)].encode('utf-8'))
            not_stopped_notes.append(not_played_notes.pop(0))
        stop = True
    return len(not_stopped_notes) == 0 and len(not_played_notes) == 0


def init():
    global already_generated, current_user_sequence, waiting_time, start_next_time, sequence
    global not_played_notes, not_stopped_notes, start_time, pressed
    already_generated = 0
    current_user_sequence = music_pb2.NoteSequence()
    waiting_time = 0
    start_next_time = 0
    sequence = 0
    already_generated = 0
    not_played_notes = []
    not_stopped_notes = []
    start_time = time.time()
    pressed = {}


def listen():
    init()
    socket_arduino = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    socket_arduino.bind(('', 15555))
    socket_arduino.listen(5)
    client_arduino, address_arduino = socket_arduino.accept()
    print("Arduino connected", address_arduino)
    while True:
        ready = select.select([client_arduino], [], [], 2)
        if ready[0]:
            response = client_arduino.recv(1).decode('utf-8')
            if response == '':
                continue
            if button_to_pitch[response] not in pressed:
                pressed[button_to_pitch[response]] = time.time() - start_time
            else:
                current_user_sequence.notes.add(pitch=int(button_to_pitch[response]), start_time=pressed[button_to_pitch[response]], end_time=time.time() - start_time, velocity=80)
                del pressed[button_to_pitch[response]]
            socketio.emit('message', button_to_pitch[response])
            eventlet.sleep(0)
        elif len(current_user_sequence.notes) > 0:
            finished = False
            while not finished:
                finished = bg_emit(client_arduino)
                eventlet.sleep(0)
            init()


@app.route('/')
def index():
    return render_template('index.html')


eventlet.spawn(listen)

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1')
