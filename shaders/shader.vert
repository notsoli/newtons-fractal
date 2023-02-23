attribute vec4 a_vertexPosition;
uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;

void main() {
    gl_Position = u_projectionMatrix * u_modelViewMatrix * a_vertexPosition;
}