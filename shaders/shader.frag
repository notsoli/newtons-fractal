precision highp float;

// constants
#define NUM_ROOTS 5
#define STEP 0.001
#define MAX_ITERATIONS 10000

// uniforms
uniform vec2 u_resolution;
uniform float u_viewWindow[4];
uniform vec3 u_colors[NUM_ROOTS];
uniform vec2 u_roots[NUM_ROOTS];
uniform int u_iterations;

// complex multiplication
vec2 multiply(vec2 a, vec2 b) {
    return vec2(a.x*b.x - a.y*b.y, a.x*b.y + a.y*b.x);
}

// complex division
vec2 divide(vec2 a, vec2 b) {
    return vec2(
        (a.x*b.x + a.y*b.y)/(b.x*b.x+b.y*b.y),
        (a.y*b.x-a.x*b.y)/(b.x*b.x+b.y*b.y)
    );
}

// evaluate using roots at desired complex number
vec2 evaluate(vec2 a) {
    // multiply every difference of the input vector and root
    vec2 result = vec2(1.0, 0.0);
    for (int i = 0; i < NUM_ROOTS; i++) {
        result = multiply(result, a-u_roots[i]);
    }
    return result;
}

// find numerical derivative at desired complex number
vec2 derivate(vec2 a) {
    vec2 eval = evaluate(a);
    vec2 eval_step = evaluate(vec2(a.x+STEP, a.y));
    return (eval_step-eval)/STEP;
}

void main() {
    // normalized (0 to 1)
    vec2 uv = gl_FragCoord.xy/u_resolution;

    // float scaleFactor = u_viewWindow[1] - u_viewWindow[0];
    float scaleFactor = 1000.0;
    
    // modify uv to fit view window
    vec2 c = vec2(
        mix(u_viewWindow[0], u_viewWindow[1], uv.x),
        mix(u_viewWindow[2], u_viewWindow[3], uv.y)
    );

    // calculate iterations
    vec2 v = c;
    for (int i = 0; i < MAX_ITERATIONS; i++) {
        if (i == u_iterations) { break; }
        v = v - divide(evaluate(v), derivate(v));
    }

    // determine the closest root
    float minDist = distance(v, u_roots[0]);
    int minIndex = 0;
    for (int i = 1; i < NUM_ROOTS; i++) {
        float dist = distance(v, u_roots[i]);
        if (dist < minDist) {
            minDist = dist;
            minIndex = i;
        }
    }

    // display correct color
    if (minIndex == 0) {
        gl_FragColor = vec4(u_colors[0], 1.0);
    } else if (minIndex == 1) {
        gl_FragColor = vec4(u_colors[1], 1.0);
    } else if (minIndex == 2) {
        gl_FragColor = vec4(u_colors[2], 1.0);
    } else if (minIndex == 3) {
        gl_FragColor = vec4(u_colors[3], 1.0);
    } else if (minIndex == 4) {
        gl_FragColor = vec4(u_colors[4], 1.0);
    }
}