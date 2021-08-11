var cubeRotation = 0.0;

main();

function main() {
  // canvasを取得
  const canvas = document.querySelector("#glcanvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

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
    attribute vec4 aVertexColor;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    varying lowp vec4 vColor;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vColor = aVertexColor;
    }
  `;

  // フラグメントシェーダー

  const fsSource = `
    varying lowp vec4 vColor;

    void main(void) {
      gl_FragColor = vColor;
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
      vertexColor: gl.getAttribLocation(shaderProgram, "aVertexColor"),
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

  let then = 0;

  //モデルを描画
  function render(now) {
    now *= 0.001;
    const deltaTime = now - then;
    then = now;

    drawScene(gl, programInfo, buffers, deltaTime);

    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

// バッファを初期化(頂点や色といったデータを格納）

function initBuffers(gl) {
  // バッファを作成

  const positionBuffer = gl.createBuffer();

  // 作成したバッファとリンクさせる

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // 四角錐の位置を表す配列

  const positions = [
    // 前面
    -1.0, -1.0, 1.0, 1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // 背面
    -1.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, -1.0, -1.0,

    // 上面
    0, 1.0, 0, 0, 1.0, 0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,

    // 底面
    -1.0, -1.0, -1.0, 1.0, -1.0, -1.0, 1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

    // 右面
    1.0, -1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, -1.0, 1.0,

    // 左面
    -1.0, -1.0, -1.0, -1.0, -1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0,
  ];

  // 位置情報を WEBGLに渡して 形を作成
  // Float32Arrayで現在のバッファを埋める

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // かく頂点の色を指定

  const faceColors = [
    [1.0, 1.0, 1.0, 1.0], // 前面: 白
    [1.0, 0.0, 0.0, 1.0], // 背面: 赤
    [0.0, 1.0, 0.0, 1.0], // 上面 緑
    [0.0, 0.0, 1.0, 1.0], // 底面: 青
    [1.0, 1.0, 0.0, 1.0], // 右面: 黄色
    [1.0, 0.0, 1.0, 1.0], // 左面: 紫
  ];

  // 色の配列を頂点に変換

  var colors = [];

  for (var j = 0; j < faceColors.length; ++j) {
    const c = faceColors[j];

    // 面の頂点に対してそれぞれの色を繰り返す
    colors = colors.concat(c, c, c, c);
  }

  const colorBuffer = gl.createBuffer();
  // 作成したバッファとリンクさせる
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  // 頂点の色情報を WEBGLに渡す
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // 各面を2つの三角形として定義

  const indices = [
    0,
    1,
    2,
    0,
    2,
    3, // front
    4,
    5,
    6,
    4,
    6,
    7, // back
    8,
    9,
    10,
    8,
    10,
    11, // top
    12,
    13,
    14,
    12,
    14,
    15, // bottom
    16,
    17,
    18,
    16,
    18,
    19, // right
    20,
    21,
    22,
    20,
    22,
    23, // left
  ];

  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  return {
    position: positionBuffer,
    color: colorBuffer,
    indices: indexBuffer,
  };
}

// モデルを描画する関数
function drawScene(gl, programInfo, buffers, deltaTime) {
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

  const fieldOfView = (45 * Math.PI) / 180; // in radians
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  const zNear = 0.1;
  const zFar = 100.0;
  const projectionMatrix = mat4.create();

  // glmatrix.jsで座標変換を行う
  mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);

  const modelViewMatrix = mat4.create();

  mat4.translate(modelViewMatrix, modelViewMatrix, [-0.0, 0.0, -8.0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation, [0, 0, 1]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, cubeRotation * 0.9, [1, 1, 0]);

  // 位置バッファからvertexPosion属性を伝える
  {
    const numComponents = 3;
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

  {
    const numComponents = 4;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexColor,
      numComponents,
      type,
      normalize,
      stride,
      offset
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexColor);
  }

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

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
    const vertexCount = 36;
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }

  cubeRotation += deltaTime;
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

// 引数に渡ってきたタイプ（頂点シェーダー or フラグメントシェーダー）を作成
// vsSouce or fsSource に代入したソースコードと紐づける

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
