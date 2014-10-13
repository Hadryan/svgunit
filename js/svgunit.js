$(function(){
  window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

  var audioCtx = new AudioContext();
  var audio = document.getElementById('song');
  var audioSrc = audioCtx.createMediaElementSource(audio);
  var analyser = audioCtx.createAnalyser();

  audioSrc.connect(analyser);
  analyser.connect(audioCtx.destination); //connect the analyser to the CTX for audio playback
  analyser.fftSize = 1024;

  var bufferLength = analyser.frequencyBinCount;
  var frequencyData = new Uint8Array(bufferLength);

  // canvas
  var canvas = document.getElementById('waveform');
  var canvasCtx = canvas.getContext('2d');

  // freq range array
  var midbuffer = [];
  var lowbuffer = [];
  var highbuffer = [];

  function draw() {
    drawVisual = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(frequencyData);
    canvasCtx.fillStyle = 'rgb(200, 200, 200)';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
    canvasCtx.lineWidth = 2;
    canvasCtx.strokeStyle = 'rgb(0, 0, 0)';

    canvasCtx.beginPath();
    canvasCtx.moveTo(0,canvas.height);

    var sliceWidth = canvas.width * 1.0 / bufferLength;
    var x = 0;

    for(var i = 0; i < bufferLength; i++) {
 
      var v = frequencyData[i] / 256.0;
      var y = canvas.height - (v * canvas.height);

      if(i === 0) {
        canvasCtx.moveTo(x, y);
      } else {
        canvasCtx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    canvasCtx.lineTo(canvas.width, canvas.height);
    canvasCtx.stroke();

    lowavg = averageFreqRange(0, 100, frequencyData);
    midavg = averageFreqRange(200, 250, frequencyData);
    highavg = averageFreqRange(250, 512, frequencyData);

    $('#low-avg').text(lowavg);
    $('#mid-avg').text(midavg);
    $('#high-avg').text(highavg);

    pushBufferAverage(lowbuffer, lowavg, 10);
    pushBufferAverage(midbuffer, midavg, 15);
    pushBufferAverage(highbuffer, highavg, 15);

    lowbuffavg = bufferAverage(lowbuffer);
    midbuffavg = bufferAverage(midbuffer);
    highbuffavg = bufferAverage(highbuffer);

    $('#low-buff').text(lowbuffavg);
    $('#mid-buff').text(midbuffavg);
    $('#high-buff').text(highbuffavg);

    lowdiff = bufferAverageDiff(lowbuffavg, lowavg);
    middiff = bufferAverageDiff(midbuffavg, midavg);
    highdiff = bufferAverageDiff(highbuffavg, highavg);

    $('#low-diff').text(lowdiff);
    $('#mid-diff').text(middiff);
    $('#high-diff').text(highdiff);

    trippedlow = lowbuffavg + 10 < lowavg;
    trippedmid = midbuffavg + 10 < midavg;
    trippedhigh = highbuffavg + 10 < highavg;

    // trippedlow = avgGainOverBuffer(lowbuffavg, lowavg) > 0.15;
    // trippedmid = avgGainOverBuffer(midbuffavg, midavg) > 0.15;
    // trippedhigh = avgGainOverBuffer(highbuffavg, highavg) > 0.25;

    // css class trip
    $('#low-indicator').toggleClass("green", trippedlow);
    $('#mid-indicator').toggleClass("green", trippedmid);
    $('#high-indicator').toggleClass("green", trippedhigh);

    if(trippedlow){
      $('#torso').attr('class', 'bob-transition bob-out');
    }else{
      $('#torso').attr('class', 'bob-transition');
    }

    if(trippedmid){
      $('#head').attr('class', 'bob-transition bob-out');
    }else{
      $('#head').attr('class', 'bob-transition');
    }

    if(trippedhigh){
      $('#hair').attr('class', 'throb-transition throb-out');
    }else{
      $('#hair').attr('class', 'throb-transition');
    }

    // console.log(frequencyData);
    // console.log(bufferLength);
  };

  function averageFreqRange(start, stop, frequencyData){
    var avg = 0;

    for(var i=start; i<stop; i++){
      avg += frequencyData[i];
    }

    return Math.round(avg/(stop-start));
  }

  function pushBufferAverage(buffer, avg, bufferSize){
    buffer.push(avg);
    if(buffer.length == bufferSize){
      buffer.shift();
    }
  }

  function bufferAverage(buffer){
    var avg = 0;

    for(var i=0; i<buffer.length; i++){
      avg += buffer[i];
    }

    return Math.round(avg/(buffer.length));
  }

  function bufferAverageDiff(buffavg, avg){
    return avg - buffavg;
  }

  function avgGainOverBuffer(buffavg, avg){
    var diff = bufferAverageDiff(buffavg, avg);
    return diff/buffavg;
  }

  draw();
  audio.play();
});