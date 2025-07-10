#!/usr/bin/env python3
import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from flask_cors import CORS

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif'}

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), UPLOAD_FOLDER)
CORS(app)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/upload', methods=['POST'])
def upload_file():
    if request.method == 'POST':
        uploaded_files = request.files.getlist('file')
        if not uploaded_files:
            return jsonify(error="No files in the request"), 400
        
        uploaded_filenames = []
        for file in uploaded_files:
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                uploaded_filenames.append(filename)
        
        if uploaded_filenames:
            return jsonify(message="Files uploaded successfully", uploaded_files=uploaded_filenames), 201
        else:
            return jsonify(error="No valid files uploaded"), 400

if __name__ == '__main__':
    app.run(port=3020)
