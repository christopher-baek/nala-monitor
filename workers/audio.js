(function() {
    var MIME_TYPE_WAV = 'audio/wav';
    var CHANNEL_COUNT = 2;
    var BYTES_PER_SAMPLE = 2;
    var CHANNEL_INDEX_LEFT = 0;
    var CHANNEL_INDEX_RIGHT = 1;

    var sampleBufferLeft = [];
    var sampleBufferRight = [];
    var sampleLength = 0;
    var sampleRate;

    this.onmessage = function(messageEvent) {
        switch(messageEvent.data.command) {
            case 'initialize':
                initialize(messageEvent.data.configuration);
                break;
            case 'record':
                record(messageEvent.data.inputBuffers);
                break;
            case 'exportWav':
                exportWav();
                break;
            case 'reset':
                reset();
                break;
        }
    };

    function initialize(configuration) {
        console.log('Initializing...');

        sampleRate = configuration.sampleRate;

        console.log('Initialization complete');
    }

    function record(inputBuffers) {
        var inputBufferLeft = inputBuffers[CHANNEL_INDEX_LEFT];
        var inputBufferRight = inputBuffers[CHANNEL_INDEX_RIGHT];

        sampleBufferLeft.push(inputBufferLeft);
        sampleBufferRight.push(inputBufferRight);

        sampleLength += inputBufferLeft.length;
    }

    function exportWav() {
        var mergedBufferLeft = _mergeBuffers(sampleBufferLeft, sampleLength);
        var mergedBufferRight = _mergeBuffers(sampleBufferRight, sampleLength);
        var interleavedBuffers = _interleaveBuffers(mergedBufferLeft, mergedBufferRight);
        var wavView = _encodeToWav(interleavedBuffers, CHANNEL_COUNT, sampleRate, BYTES_PER_SAMPLE);
        var wavBlob = new Blob([wavView], {type: MIME_TYPE_WAV});

        console.log('Exporting ' + wavBlob.size + ' byte WAV');
        this.postMessage({wavBlob: wavBlob});
    }

    function _mergeBuffers(sampleBuffers, sampleLength) {
        var mergedBuffers = new Float32Array(sampleLength);
        var offset = 0;

        for (var i = 0; i < sampleBuffers.length; i++) {
            var sampleBuffer = sampleBuffers[i];

            mergedBuffers.set(sampleBuffer, offset);
            offset += sampleBuffer.length;
        }

        return mergedBuffers;
    }

    function _interleaveBuffers(bufferLeft, bufferRight) {
        var interleavedLength = bufferLeft.length + bufferRight.length;
        var interleavedBuffer = new Float32Array(interleavedLength);

        var inputIndex = 0;
        var outputIndex = 0;

        while (outputIndex < interleavedLength) {
            interleavedBuffer[outputIndex++] = bufferLeft[inputIndex];
            interleavedBuffer[outputIndex++] = bufferRight[inputIndex];
            inputIndex++;
        }

        return interleavedBuffer;
    }

    function _encodeToWav(buffer, channelCount, sampleRate, bytesPerSample) {
        var wavBuffer = new ArrayBuffer(44 + buffer.length * 2);
        var wavView = new DataView(wavBuffer);

        /* RIFF identifier */
        _writeString(wavView, 0, 'RIFF');
        /* file length */
        wavView.setUint32(4, 32 + buffer.length * 2, true);
        /* RIFF type */
        _writeString(wavView, 8, 'WAVE');
        /* format chunk identifier */
        _writeString(wavView, 12, 'fmt ');
        /* format chunk length */
        wavView.setUint32(16, 16, true);
        /* sample format (raw) */
        wavView.setUint16(20, 1, true);
        /* channel count */
        wavView.setUint16(22, channelCount, true);
        /* sample rate */
        wavView.setUint32(24, sampleRate, true);
        /* byte rate (sample rate * block align) */
        wavView.setUint32(28, sampleRate * 4, true);
        /* block align (channel count * bytes per sample) */
        wavView.setUint16(32, channelCount * bytesPerSample, true);
        /* bits per sample */
        wavView.setUint16(34, 16, true);
        /* data chunk identifier */
        _writeString(wavView, 36, 'data');
        /* data chunk length */
        wavView.setUint32(40, buffer.length * 2, true);

        _floatTo16BitPCM(wavView, 44, buffer);

        return wavView;
    }

    function _writeString(view, offset, value) {
        for (var i = 0; i < value.length; i++) {
            view.setUint8(offset + i, value.charCodeAt(i));
        }
    }

    function _floatTo16BitPCM(view, offset, input) {
        for (var i = 0; i < input.length; i++, offset += 2) {
            var sample = Math.max(-1, Math.min(1, input[i]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;

            view.setInt16(offset, sample, true);
        }
    }

    function reset() {
        console.log('Resetting...');

        sampleBufferLeft = [];
        sampleBufferRight = [];
        sampleLength = 0;

        console.log('Reset complete');
    }

})();