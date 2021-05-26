main();

function main() {
  // canvasを取得
  const canvas = document.querySelector("#glcanvas");
  // webglコンテキストを宣言
  const gl = canvas.getContext("webgl");

  // webglコンテキストではない場合、アラートを出力
  if (!gl) {
    alert(
      "WebGLを初期化できませんでした。お使いのブラウザやパソコンがサポートしていない可能性があります。"
    );
    return;
  }

  // 頂点シェーダー
  const vsSource = `
    // 頂点情報を格納
    attribute vec4 aVertexPosition;

    uniform mat4 uModelViewMatrix; // 4*4マトリクス
    uniform mat4 uProjectionMatrix; // 4*4マトリクス

    void main() {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
  `;

  // フラグメントシェーダー
  const fsSource = `
    void main() {
      gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0); //モデルの色を指定：白
    }
  `;

  // シェーダープログラムの初期化
  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

  // シェーダープログラムを使用するために必要な情報を集める
  // シェーダープログラムが aVertexPositionで使用している属性を調べる
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, "aVertexPosition"),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        "uProjectionMatrix"
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, "uModelViewMatrix"),
    },
  };

  // バッファを初期化する関数
  const buffers = initBuffers(gl);

  // モデルを描画
  drawScene(gl, programInfo, buffers);
}

// バッファを初期化(頂点や色といったデータを格納）
function initBuffers(gl) {
  // バッファを作成
  const positionBuffer = gl.createBuffer();

  // 作成したバッファとリンクさせる
  // ARRAY_BUFFER: 頂点の属性を含むバッファで、頂点座標、頂点色データのようなもの
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 正方形の位置を表す配列
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

  // 位置情報を WEBGLに渡して 形を作成
  // Float32Arrayで現在のバッファを埋める

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
  };
}

// モデルを描画する関数

function drawScene(gl, programInfo, buffers) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0); // バッファの消去に黒を指定
  gl.clearDepth(1.0); // 深度を初期化
  gl.enable(gl.DEPTH_TEST); // 深度テストを有効
  gl.depthFunc(gl.LEQUAL); // 深度テスト：奥にあるものが隠れる

  // 描画する前にキャンバスを初期化
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // パースペクティブマトリックスを作成
  // カメラの遠近感の歪みをシミュレートするために使用
  // 視野は45度、幅と高さの比率はキャンバスの表示サイズに合わせる
  // 0.1単位から100単位までの範囲の物体だけを表示する

  const fieldOfView = (45 * Math.PI) / 180; // ラジアン
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // glmatrix.js で座標変換を行う
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();

  // 描画位置を指定の数値だけ移動

  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -6.0]);

  // 位置バッファからvertexPosion属性を伝える
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  // 描画する際に、作成したprogramInfo変数を使用するように設定

  gl.useProgram(programInfo.program);

  // シェーダーユニフォームの設定

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );

  {
    const offset = 0;
    const vertexCount = 4;
    gl.drawArrays(gl.TRIANGLE_STRIP, offset, vertexCount);
  }
}

//
// WebGL シェーダープログラムの初期化
//
function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // シェーダープログラムの作成

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // シェーダープログラムの作成に失敗した場合、アラートを出力

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "シェーダープログラムを初期化できない: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

//
// 引数に渡ってきたタイプ（頂点シェーダー or フラグメントシェーダー）を作成
// vsSouce or fsSource に代入したソースコードと紐づける
//
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // 作成したシェーダータイプにソースコードを送る
  gl.shaderSource(shader, source);

  // シェーダープログラムをコンパイル
  gl.compileShader(shader);

  // コンパイルの成功確認
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "シェーダーのコンパイル時にエラーが発生しました: " +
        gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}
