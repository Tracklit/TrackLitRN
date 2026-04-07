import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { Avatar } from '@/components/ui/Avatar';
import { spacing, borderRadius } from '@/utils/theme';

type BackgroundType = 'color' | 'image';

interface TradingCardPreviewProps {
  name?: string | null;
  username?: string | null;
  bio?: string | null;
  profileImageUrl?: string | null;
  subscriptionTier?: string | null;
  backgroundType?: BackgroundType;
  backgroundColor?: string;
  backgroundImage?: string | null;
  memberSinceYear?: string | null;
  cardNumber?: number | null;
}

export const TradingCardPreview: React.FC<TradingCardPreviewProps> = ({
  name,
  username,
  bio,
  profileImageUrl,
  subscriptionTier,
  backgroundType = 'color',
  backgroundColor = '#1e293b',
  backgroundImage,
  memberSinceYear,
  cardNumber,
}) => {
  const tierLabel = subscriptionTier ? subscriptionTier.toUpperCase() : 'FREE';
  const cardNumberLabel =
    typeof cardNumber === 'number' && Number.isFinite(cardNumber)
      ? `#${cardNumber.toString().padStart(4, '0')}`
      : null;

  return (
    <View style={styles.wrapper}>
      <View style={styles.outerBorder}>
        <View style={styles.card}>
          {/* Background layer */}
          <View
            style={[
              StyleSheet.absoluteFill,
              backgroundType === 'image' && backgroundImage
                ? {
                    overflow: 'hidden',
                  }
                : { backgroundColor },
            ]}
          >
            {backgroundType === 'image' && backgroundImage ? (
              <Image source={{ uri: backgroundImage }} style={styles.bgImage} resizeMode="cover" />
            ) : null}
            <View style={styles.bgOverlay} />
          </View>

          <View style={styles.content}>
            <View style={styles.tierPill}>
              <Text variant="small" weight="bold" color="foreground">
                {tierLabel}
              </Text>
            </View>

            <View style={styles.avatarBlock}>
              <View style={styles.avatarRing}>
                {profileImageUrl ? (
                  <Image source={{ uri: profileImageUrl }} style={styles.avatarImage} />
                ) : (
                  <Avatar
                    size="xl"
                    fallback={name?.charAt(0) || username?.charAt(0) || 'U'}
                    src={undefined}
                  />
                )}
              </View>
              <View style={styles.nameBlock}>
                <Text variant="h3" weight="bold" color="foreground" style={styles.name}>
                  {name || username || 'TrackLit Athlete'}
                </Text>
                {username ? (
                  <Text variant="body" color="primary">
                    @{username}
                  </Text>
                ) : null}
              </View>
            </View>

            {bio ? (
              <Text variant="small" color="muted" style={styles.bio}>
                {bio}
              </Text>
            ) : null}

            <View style={styles.statsRow}>
              <Stat label="PB" value="—" />
              <Stat label="Nation" value="—" />
              <Stat label="Workouts" value="—" />
              <Stat label="Friends" value="—" />
            </View>

            {memberSinceYear ? (
              <Text variant="small" color="muted" style={styles.memberSince}>
                Member since {memberSinceYear}
              </Text>
            ) : null}

            {cardNumberLabel ? (
              <Text variant="body" weight="semiBold" color="primary">
                {cardNumberLabel}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.stat}>
    <Text variant="small" color="primary" weight="medium">
      {label}
    </Text>
    <Text variant="body" color="foreground" weight="semiBold">
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  outerBorder: {
    width: '100%',
    borderRadius: 24,
    padding: 6,
    backgroundColor: '#d4af37',
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    minHeight: 380,
    backgroundColor: '#0f172a',
  },
  bgImage: {
    width: '100%',
    height: '100%',
  },
  bgOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  content: {
    flex: 1,
    padding: spacing.xl,
    gap: spacing.lg,
    alignItems: 'center',
  },
  tierPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    backgroundColor: '#f5c842',
  },
  avatarBlock: {
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 999,
    backgroundColor: '#f5c842',
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: '#0f172a',
  },
  nameBlock: {
    alignItems: 'center',
  },
  name: {
    textAlign: 'center',
  },
  bio: {
    textAlign: 'center',
    lineHeight: 18,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  memberSince: {
    textAlign: 'center',
  },
});

