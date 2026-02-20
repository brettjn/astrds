#!/usr/bin/env python3
"""
Asteroids - A clone of the classic arcade game
Controls:
- Left/Right Arrow: Rotate ship
- Alt: Thrusters (move forward)
- Spacebar: Fire
- Ctrl: Hyperspace (random teleport)
- ESC: Quit game
- R: Restart after game over
"""

import pygame
import math
import random
from pygame.math import Vector2

# Initialize Pygame
pygame.init()

# Constants
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60

# Colors
BLACK = (0, 0, 0)
WHITE = (255, 255, 255)
RED = (255, 0, 0)
GREEN = (0, 255, 0)
YELLOW = (255, 255, 0)

# Game settings
SHIP_ROTATION_SPEED = 5
SHIP_ACCELERATION = 0.2
SHIP_MAX_SPEED = 8
SHIP_FRICTION = 0.99
BULLET_SPEED = 10
BULLET_LIFETIME = 40
MAX_BULLETS = 5
ASTEROID_SPEED_BASE = 2
HYPERSPACE_COOLDOWN = 60  # frames

# Asteroid sizes
ASTEROID_SIZES = {
    'large': 40,
    'medium': 25,
    'small': 15
}


class Ship:
    def __init__(self, x, y):
        self.pos = Vector2(x, y)
        self.velocity = Vector2(0, 0)
        self.angle = 0  # degrees, 0 is up
        self.size = 15
        self.alive = True
        self.invulnerable = 0  # invulnerability timer after hyperspace
        
    def rotate_left(self):
        self.angle -= SHIP_ROTATION_SPEED
        
    def rotate_right(self):
        self.angle += SHIP_ROTATION_SPEED
        
    def thrust(self):
        # Convert angle to radians and add 90 degrees offset (0 is up, not right)
        rad = math.radians(self.angle - 90)
        accel = Vector2(math.cos(rad), math.sin(rad)) * SHIP_ACCELERATION
        self.velocity += accel
        
        # Limit max speed
        if self.velocity.length() > SHIP_MAX_SPEED:
            self.velocity.scale_to_length(SHIP_MAX_SPEED)
    
    def hyperspace(self):
        """Teleport to random position"""
        self.pos.x = random.randint(50, SCREEN_WIDTH - 50)
        self.pos.y = random.randint(50, SCREEN_HEIGHT - 50)
        self.velocity = Vector2(0, 0)
        self.invulnerable = 60  # 1 second of invulnerability
        
    def update(self):
        if not self.alive:
            return
            
        # Apply friction
        self.velocity *= SHIP_FRICTION
        
        # Update position
        self.pos += self.velocity
        
        # Wrap around screen
        if self.pos.x < 0:
            self.pos.x = SCREEN_WIDTH
        elif self.pos.x > SCREEN_WIDTH:
            self.pos.x = 0
            
        if self.pos.y < 0:
            self.pos.y = SCREEN_HEIGHT
        elif self.pos.y > SCREEN_HEIGHT:
            self.pos.y = 0
            
        # Update invulnerability
        if self.invulnerable > 0:
            self.invulnerable -= 1
    
    def get_points(self):
        """Get triangle points for ship"""
        rad = math.radians(self.angle - 90)
        
        # Front point
        front = Vector2(
            self.pos.x + math.cos(rad) * self.size,
            self.pos.y + math.sin(rad) * self.size
        )
        
        # Back left point
        back_angle_left = rad + math.radians(140)
        back_left = Vector2(
            self.pos.x + math.cos(back_angle_left) * self.size,
            self.pos.y + math.sin(back_angle_left) * self.size
        )
        
        # Back right point
        back_angle_right = rad - math.radians(140)
        back_right = Vector2(
            self.pos.x + math.cos(back_angle_right) * self.size,
            self.pos.y + math.sin(back_angle_right) * self.size
        )
        
        return [(front.x, front.y), (back_left.x, back_left.y), (back_right.x, back_right.y)]
    
    def draw(self, screen):
        if not self.alive:
            return
            
        # Flash when invulnerable
        if self.invulnerable > 0 and self.invulnerable % 6 < 3:
            return
            
        points = self.get_points()
        pygame.draw.polygon(screen, WHITE, points, 2)


class Bullet:
    def __init__(self, x, y, angle):
        self.pos = Vector2(x, y)
        rad = math.radians(angle - 90)
        self.velocity = Vector2(
            math.cos(rad) * BULLET_SPEED,
            math.sin(rad) * BULLET_SPEED
        )
        self.lifetime = BULLET_LIFETIME
        self.alive = True
        
    def update(self):
        self.pos += self.velocity
        self.lifetime -= 1
        
        # Wrap around screen
        if self.pos.x < 0:
            self.pos.x = SCREEN_WIDTH
        elif self.pos.x > SCREEN_WIDTH:
            self.pos.x = 0
            
        if self.pos.y < 0:
            self.pos.y = SCREEN_HEIGHT
        elif self.pos.y > SCREEN_HEIGHT:
            self.pos.y = 0
        
        if self.lifetime <= 0:
            self.alive = False
    
    def draw(self, screen):
        if self.alive:
            pygame.draw.circle(screen, WHITE, (int(self.pos.x), int(self.pos.y)), 2)


class Asteroid:
    def __init__(self, x, y, size='large', velocity=None):
        self.pos = Vector2(x, y)
        self.size_type = size
        self.radius = ASTEROID_SIZES[size]
        
        if velocity is None:
            # Random velocity
            angle = random.uniform(0, 2 * math.pi)
            speed = random.uniform(1, ASTEROID_SPEED_BASE)
            self.velocity = Vector2(math.cos(angle) * speed, math.sin(angle) * speed)
        else:
            self.velocity = velocity
            
        self.alive = True
        
        # Generate random asteroid shape
        self.points = []
        num_points = random.randint(8, 12)
        for i in range(num_points):
            angle = (2 * math.pi * i) / num_points
            distance = self.radius + random.uniform(-5, 5)
            self.points.append(Vector2(
                math.cos(angle) * distance,
                math.sin(angle) * distance
            ))
    
    def update(self):
        self.pos += self.velocity
        
        # Wrap around screen
        if self.pos.x < -self.radius:
            self.pos.x = SCREEN_WIDTH + self.radius
        elif self.pos.x > SCREEN_WIDTH + self.radius:
            self.pos.x = -self.radius
            
        if self.pos.y < -self.radius:
            self.pos.y = SCREEN_HEIGHT + self.radius
        elif self.pos.y > SCREEN_HEIGHT + self.radius:
            self.pos.y = -self.radius
    
    def draw(self, screen):
        if self.alive:
            points = [(self.pos.x + p.x, self.pos.y + p.y) for p in self.points]
            pygame.draw.polygon(screen, WHITE, points, 2)
    
    def split(self):
        """Return smaller asteroids when this one is destroyed"""
        if self.size_type == 'large':
            return [
                Asteroid(self.pos.x, self.pos.y, 'medium', 
                        Vector2(self.velocity.x + random.uniform(-1, 1), 
                               self.velocity.y + random.uniform(-1, 1))),
                Asteroid(self.pos.x, self.pos.y, 'medium',
                        Vector2(self.velocity.x + random.uniform(-1, 1), 
                               self.velocity.y + random.uniform(-1, 1)))
            ]
        elif self.size_type == 'medium':
            return [
                Asteroid(self.pos.x, self.pos.y, 'small',
                        Vector2(self.velocity.x + random.uniform(-1, 1), 
                               self.velocity.y + random.uniform(-1, 1))),
                Asteroid(self.pos.x, self.pos.y, 'small',
                        Vector2(self.velocity.x + random.uniform(-1, 1), 
                               self.velocity.y + random.uniform(-1, 1)))
            ]
        else:
            return []


class Game:
    def __init__(self):
        self.screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
        pygame.display.set_caption("Asteroids")
        self.clock = pygame.time.Clock()
        self.font = pygame.font.Font(None, 36)
        self.small_font = pygame.font.Font(None, 24)
        
        self.reset_game()
        
    def reset_game(self):
        self.ship = Ship(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
        self.bullets = []
        self.asteroids = []
        self.score = 0
        self.lives = 3
        self.level = 1
        self.game_over = False
        self.hyperspace_timer = 0
        
        self.spawn_asteroids(4)
    
    def spawn_asteroids(self, count):
        """Spawn asteroids away from the ship"""
        for _ in range(count):
            while True:
                x = random.randint(50, SCREEN_WIDTH - 50)
                y = random.randint(50, SCREEN_HEIGHT - 50)
                
                # Make sure asteroid doesn't spawn too close to ship
                dist = math.hypot(x - self.ship.pos.x, y - self.ship.pos.y)
                if dist > 150:
                    self.asteroids.append(Asteroid(x, y, 'large'))
                    break
    
    def check_collision_circle(self, pos1, radius1, pos2, radius2):
        """Simple circle collision detection"""
        dist = math.hypot(pos1.x - pos2.x, pos1.y - pos2.y)
        return dist < (radius1 + radius2)
    
    def handle_input(self):
        keys = pygame.key.get_pressed()
        
        if keys[pygame.K_LEFT]:
            self.ship.rotate_left()
        if keys[pygame.K_RIGHT]:
            self.ship.rotate_right()
        if keys[pygame.K_LALT] or keys[pygame.K_RALT]:
            self.ship.thrust()
        
    def update(self):
        if self.game_over:
            return
            
        # Update hyperspace cooldown
        if self.hyperspace_timer > 0:
            self.hyperspace_timer -= 1
        
        # Update ship
        self.ship.update()
        
        # Update bullets
        for bullet in self.bullets[:]:
            bullet.update()
            if not bullet.alive:
                self.bullets.remove(bullet)
        
        # Update asteroids
        for asteroid in self.asteroids:
            asteroid.update()
        
        # Check bullet-asteroid collisions
        for bullet in self.bullets[:]:
            if not bullet.alive:
                continue
            for asteroid in self.asteroids[:]:
                if not asteroid.alive:
                    continue
                if self.check_collision_circle(bullet.pos, 2, asteroid.pos, asteroid.radius):
                    bullet.alive = False
                    asteroid.alive = False
                    
                    # Add score
                    if asteroid.size_type == 'large':
                        self.score += 20
                    elif asteroid.size_type == 'medium':
                        self.score += 50
                    else:
                        self.score += 100
                    
                    # Split asteroid
                    new_asteroids = asteroid.split()
                    self.asteroids.extend(new_asteroids)
                    
                    if bullet in self.bullets:
                        self.bullets.remove(bullet)
                    if asteroid in self.asteroids:
                        self.asteroids.remove(asteroid)
                    break
        
        # Check ship-asteroid collisions
        if self.ship.alive and self.ship.invulnerable == 0:
            for asteroid in self.asteroids:
                if asteroid.alive:
                    if self.check_collision_circle(self.ship.pos, self.ship.size, 
                                                   asteroid.pos, asteroid.radius):
                        self.ship.alive = False
                        self.lives -= 1
                        
                        if self.lives > 0:
                            # Respawn ship after delay
                            pygame.time.set_timer(pygame.USEREVENT + 1, 2000, 1)
                        else:
                            self.game_over = True
                        break
        
        # Check if level complete
        if len(self.asteroids) == 0 and not self.game_over:
            self.level += 1
            self.spawn_asteroids(3 + self.level)
    
    def draw(self):
        self.screen.fill(BLACK)
        
        # Draw game objects
        self.ship.draw(self.screen)
        
        for bullet in self.bullets:
            bullet.draw(self.screen)
        
        for asteroid in self.asteroids:
            asteroid.draw(self.screen)
        
        # Draw HUD
        score_text = self.font.render(f"Score: {self.score}", True, WHITE)
        self.screen.blit(score_text, (10, 10))
        
        lives_text = self.font.render(f"Lives: {self.lives}", True, WHITE)
        self.screen.blit(lives_text, (10, 50))
        
        level_text = self.font.render(f"Level: {self.level}", True, WHITE)
        self.screen.blit(level_text, (SCREEN_WIDTH - 150, 10))
        
        # Draw game over screen
        if self.game_over:
            game_over_text = self.font.render("GAME OVER", True, RED)
            text_rect = game_over_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 - 30))
            self.screen.blit(game_over_text, text_rect)
            
            restart_text = self.small_font.render("Press R to restart or ESC to quit", True, WHITE)
            restart_rect = restart_text.get_rect(center=(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2 + 20))
            self.screen.blit(restart_text, restart_rect)
        
        # Draw controls help
        help_text = self.small_font.render("← → Rotate | Alt Thrust | Space Fire | Ctrl Hyperspace", True, GREEN)
        self.screen.blit(help_text, (10, SCREEN_HEIGHT - 30))
        
        pygame.display.flip()
    
    def run(self):
        running = True
        
        while running:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_SPACE and not self.game_over:
                        # Fire bullet
                        if len(self.bullets) < MAX_BULLETS and self.ship.alive:
                            bullet = Bullet(self.ship.pos.x, self.ship.pos.y, self.ship.angle)
                            self.bullets.append(bullet)
                    elif (event.key == pygame.K_LCTRL or event.key == pygame.K_RCTRL) and not self.game_over:
                        # Hyperspace
                        if self.ship.alive and self.hyperspace_timer == 0:
                            self.ship.hyperspace()
                            self.hyperspace_timer = HYPERSPACE_COOLDOWN
                    elif event.key == pygame.K_r and self.game_over:
                        # Restart game
                        self.reset_game()
                elif event.type == pygame.USEREVENT + 1:
                    # Respawn ship
                    if not self.game_over:
                        self.ship = Ship(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
                        self.ship.invulnerable = 120  # 2 seconds of invulnerability
            
            self.handle_input()
            self.update()
            self.draw()
            
            self.clock.tick(FPS)
        
        pygame.quit()


def main():
    game = Game()
    game.run()


if __name__ == "__main__":
    main()
