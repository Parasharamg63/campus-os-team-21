import { Card, Stack, Text } from '@/ui'

export function HomeScreen() {
  return (
    <Stack gap={4}>
      <Text as="h1" size="2xl" weight="bold">Maintenance Tickets</Text>
      <Card>
        <Text tone="textMuted" data-testid="maintenance-tickets-placeholder">
          Start building in <code>src/tracks/maintenance-tickets</code>.
        </Text>
      </Card>
    </Stack>
  )
}
