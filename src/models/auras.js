// Efeitos que ficam grudados no unicórnio enquanto um power-up está valendo:
// a bolha do escudo, os anéis do ímã e os anéis de velocidade do turbo.
import * as THREE from 'three';

export const FLASH_TIME = 0.9;   // duração do brilho da vida extra

function basic(color, opacity, extra = {}) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, ...extra,
  });
}

export function createAuras() {
  const auras = new THREE.Group();

  // 🛡️ Bolha de proteção: uma esfera translúcida + uma "rede" por cima.
  const shield = new THREE.Group();
  const bubble = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.45, 3),
    basic(0x9bd8ff, 0.2, { side: THREE.DoubleSide })
  );
  const net = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.48, 1),
    basic(0xd9f2ff, 0.35, { wireframe: true })
  );
  shield.add(bubble, net);
  shield.position.y = 1.2;
  shield.visible = false;
  auras.add(shield);

  // 🧲 Ímã: três argolas girando em volta do unicórnio.
  const magnet = new THREE.Group();
  const ringGeo = new THREE.TorusGeometry(1.15, 0.055, 6, 24);
  for (let i = 0; i < 3; i++) {
    const ring = new THREE.Mesh(ringGeo, basic(i === 1 ? 0xffb3d1 : 0xff5d8f, 0.75));
    ring.rotation.set(Math.PI / 2, 0, (i - 1) * 0.5);
    ring.userData.spin = 1 + i * 0.4;
    magnet.add(ring);
  }
  magnet.position.y = 1.2;
  magnet.visible = false;
  auras.add(magnet);

  // ⚡ Turbo: anéis dourados que escapam para trás, como rastro de velocidade.
  const boost = new THREE.Group();
  const boostGeo = new THREE.TorusGeometry(0.85, 0.09, 6, 20);
  for (let i = 0; i < 4; i++) {
    const ring = new THREE.Mesh(boostGeo, basic(0xffe066, 0.7));
    ring.userData.offset = i / 4;
    boost.add(ring);
  }
  boost.position.y = 1.25;
  boost.visible = false;
  auras.add(boost);

  // 💖 Vida extra: dois anéis rosa que abrem uma vez, no momento em que pega.
  const flash = new THREE.Group();
  const flashGeo = new THREE.TorusGeometry(0.8, 0.1, 6, 20);
  for (let i = 0; i < 2; i++) {
    const ring = new THREE.Mesh(flashGeo, basic(0xff8fb1, 0.8));
    ring.rotation.x = Math.PI / 2;
    ring.userData.delay = i * 0.25;
    flash.add(ring);
  }
  flash.position.y = 1.1;
  flash.visible = false;
  auras.add(flash);

  // 💫 Batida: estrelinhas girando em volta da cabeça enquanto pisca.
  const dizzy = new THREE.Group();
  const starGeo = new THREE.OctahedronGeometry(0.16, 0);
  for (let i = 0; i < 4; i++) {
    const star = new THREE.Mesh(starGeo, basic(0xffe066, 0.95));
    star.userData.offset = (i / 4) * Math.PI * 2;
    dizzy.add(star);
  }
  dizzy.position.y = 2.5;
  dizzy.visible = false;
  auras.add(dizzy);

  auras.userData = { shield, magnet, boost, flash, dizzy };
  return auras;
}

// `powers` são os segundos restantes de cada efeito.
export function updateAuras(auras, powers, time) {
  const { shield, magnet, boost, flash, dizzy } = auras.userData;

  // No último segundo tudo pisca, avisando que vai acabar.
  const fade = (left) => (left > 1 ? 1 : Math.max(0, left) * (0.5 + Math.sin(time * 22) * 0.5));

  shield.visible = powers.shield > 0;
  if (shield.visible) {
    const pulse = 1 + Math.sin(time * 6) * 0.04;
    shield.scale.setScalar(pulse);
    shield.rotation.y = time * 0.6;
    const alpha = fade(powers.shield);
    shield.children[0].material.opacity = 0.2 * alpha;
    shield.children[1].material.opacity = 0.35 * alpha;
  }

  magnet.visible = powers.magnet > 0;
  if (magnet.visible) {
    const alpha = fade(powers.magnet);
    magnet.children.forEach((ring, i) => {
      ring.rotation.z = (i - 1) * 0.5 + time * ring.userData.spin;
      ring.rotation.x = Math.PI / 2 + Math.sin(time * 1.5 + i) * 0.35;
      ring.material.opacity = 0.75 * alpha;
    });
  }

  // A vida extra dura pouquinho: `powers.flash` conta de FLASH_TIME a 0.
  flash.visible = powers.flash > 0;
  if (flash.visible) {
    for (const ring of flash.children) {
      const t = Math.max(0, Math.min(1, 1 - (powers.flash - ring.userData.delay) / FLASH_TIME));
      ring.scale.setScalar(0.5 + t * 2.2);
      ring.position.y = t * 1.2;
      ring.material.opacity = (1 - t) * 0.8;
    }
  }

  dizzy.visible = powers.dizzy > 0;
  if (dizzy.visible) {
    for (const star of dizzy.children) {
      const a = time * 5 + star.userData.offset;
      star.position.set(Math.cos(a) * 0.55, Math.sin(a * 2) * 0.1, Math.sin(a) * 0.55);
      star.rotation.set(a, a * 1.4, 0);
      star.material.opacity = Math.min(1, powers.dizzy * 1.5) * 0.95;
    }
  }

  boost.visible = powers.boost > 0;
  if (boost.visible) {
    const alpha = fade(powers.boost);
    for (const ring of boost.children) {
      const t = (time * 1.8 + ring.userData.offset) % 1;
      ring.position.z = 0.3 + t * 3.4;         // vai ficando para trás
      ring.scale.setScalar(0.55 + t * 1.05);
      ring.material.opacity = (1 - t) * 0.7 * alpha;
    }
  }
}
