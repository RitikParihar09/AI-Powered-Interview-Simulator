import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * AIOrb Component
 * Calm, subtle motion for AI interview platforms
 */
export default function AIOrb({ isSpeaking = false }) {
    const mountRef = useRef(null);
    const materialRef = useRef(null);
    const currentIntensityRef = useRef(0.12);

    // ================== SHADERS ==================
    const vertexShader = `
    uniform float uTime;
    uniform float uIntensity;

    varying float vDistort;
    varying vec3 vNormal;
    varying vec2 vUv;

    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
    vec4 taylorInvSqrt(vec4 r) { 
        return 1.79284291400159 - 0.85373472095314 * r; 
    }

    float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);

        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);

        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;

        i = mod289(i);
        vec4 p = permute(
            permute(
                permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                + i.y + vec4(0.0, i1.y, i2.y, 1.0)
            )
            + i.x + vec4(0.0, i1.x, i2.x, 1.0)
        );

        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;

        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);

        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);

        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);

        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));

        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);

        vec4 norm = taylorInvSqrt(
            vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3))
        );

        p0 *= norm.x;
        p1 *= norm.y;
        p2 *= norm.z;
        p3 *= norm.w;

        vec4 m = max(
            0.6 - vec4(
                dot(x0, x0),
                dot(x1, x1),
                dot(x2, x2),
                dot(x3, x3)
            ),
            0.0
        );

        m = m * m;

        return 42.0 * dot(
            m * m,
            vec4(
                dot(p0, x0),
                dot(p1, x1),
                dot(p2, x2),
                dot(p3, x3)
            )
        );
    }

    void main() {
        vUv = uv;
        vNormal = normal;

        float noise = snoise(vec3(position * 1.6 + uTime * 0.15));
        vDistort = clamp(noise * uIntensity, -0.25, 0.25);

        vec3 newPos = position + normal * vDistort;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPos, 1.0);
    }
    `;

    const fragmentShader = `
    uniform float uTime;

    varying float vDistort;
    varying vec3 vNormal;
    varying vec2 vUv;

    void main() {
        vec3 blue = vec3(0.0, 0.7, 1.0);
        vec3 pink = vec3(1.0, 0.0, 0.8);

        float mixFactor = vDistort + 0.5;
        vec3 baseColor = mix(blue, pink, clamp(mixFactor + vNormal.y * 0.3, 0.0, 1.0));

        float glow = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        vec3 finalColor = baseColor + glow * pink * 0.4;

        float alpha = 0.6 + glow * 0.3;
        gl_FragColor = vec4(finalColor, alpha);
    }
    `;

    // ================== THREE SETUP ==================
    useEffect(() => {
        const scene = new THREE.Scene();

        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 100);
        camera.position.z = 2.5;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mountRef.current.appendChild(renderer.domElement);

        const resize = () => {
            if (!mountRef.current) return;
            const w = mountRef.current.clientWidth;
            const h = mountRef.current.clientHeight;
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        };
        resize();
        window.addEventListener('resize', resize);

        const geometry = new THREE.SphereGeometry(1, 128, 128);
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            transparent: true,
            wireframe: true,
            blending: THREE.AdditiveBlending,
            uniforms: {
                uTime: { value: 0 },
                uIntensity: { value: currentIntensityRef.current }
            }
        });
        materialRef.current = material;

        const orb = new THREE.Mesh(geometry, material);
        scene.add(orb);

        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 64, 64),
            new THREE.MeshBasicMaterial({
                color: 0x220044,
                transparent: true,
                opacity: 0.2
            })
        );
        scene.add(core);

        let raf;
        const animate = (t) => {
            material.uniforms.uTime.value = t * 0.001;
            material.uniforms.uIntensity.value = currentIntensityRef.current;

            orb.rotation.y += 0.0008;
            orb.rotation.z += 0.0004;

            renderer.render(scene, camera);
            raf = requestAnimationFrame(animate);
        };
        raf = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            renderer.dispose();
            geometry.dispose();
            material.dispose();
        };
    }, []);

    // ================== SPEAKING CONTROL ==================
    useEffect(() => {
        const target = isSpeaking ? 0.22 : 0.12;

        const ease = () => {
            currentIntensityRef.current +=
                (target - currentIntensityRef.current) * 0.06;

            if (Math.abs(target - currentIntensityRef.current) > 0.001) {
                requestAnimationFrame(ease);
            }
        };
        ease();
    }, [isSpeaking]);

    return <div ref={mountRef} style={{ width: '100%', height: '100%' }} />;
}
