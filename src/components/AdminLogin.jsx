// src/components/AdminLogin.jsx
import React, { useState } from 'react';
import { Modal, TextInput, Button, Text } from '@mantine/core';
import { IconLock, IconShieldCheck } from '@tabler/icons-react';
import { verifyPassword } from '../utils/store';
import { COLORS } from '../utils/theme';

export default function AdminLogin({ open, onClose, onSuccess }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (verifyPassword(password)) {
        setPassword('');
        onSuccess();
      } else {
        setError('Contrasena incorrecta');
      }
      setLoading(false);
    }, 500);
  };

  return (
    <Modal
      opened={open}
      onClose={() => { onClose(); setPassword(''); setError(''); }}
      title={null}
      centered
      radius="lg"
      size="sm"
      overlayProps={{ backgroundOpacity: 0.6, blur: 8 }}
      styles={{
        header: { display: 'none' },
        body: { padding: '32px 24px' },
      }}
    >
      <form onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: COLORS.orangePale,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <IconShieldCheck size={28} color={COLORS.orange} />
          </div>
          <Text
            style={{
              fontFamily: '"Playfair Display", serif',
              fontSize: '1.3rem',
              fontWeight: 600,
              color: COLORS.navy,
              marginBottom: 4,
            }}
          >
            Acceso Administrador
          </Text>
          <Text size="sm" c="dimmed">
            Ingresa tu contrasena para continuar
          </Text>
        </div>

        <TextInput
          type="password"
          placeholder="Contrasena"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          error={error}
          leftSection={<IconLock size={16} color={COLORS.textMuted} />}
          styles={{
            input: {
              border: `1px solid ${COLORS.borderLight}`,
              '&:focus': { borderColor: COLORS.orange },
            },
          }}
          radius="lg"
          size="md"
        />

        <Button
          type="submit"
          fullWidth
          mt="lg"
          radius="xl"
          size="md"
          loading={loading}
          style={{
            background: COLORS.navy,
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 500,
            letterSpacing: '0.5px',
          }}
        >
          Ingresar
        </Button>

        <Button
          variant="subtle"
          fullWidth
          mt="xs"
          radius="xl"
          onClick={() => { onClose(); setPassword(''); setError(''); }}
          style={{ color: COLORS.textMuted }}
        >
          Cancelar
        </Button>
      </form>
    </Modal>
  );
}
