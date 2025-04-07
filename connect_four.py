import numpy as np
import random
import pygame
import sys
import math

# Colors and constants
BLUE = (0, 0, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
YELLOW = (255, 255, 0)
WHITE = (255, 255, 255)
VIBRANT_GREEN = (0, 255, 0)
VIBRANT_PURPLE = (128, 0, 128)
VIBRANT_ORANGE = (255, 165, 0)

ROW_COUNT = 6
COLUMN_COUNT = 7
SQUARESIZE = 100
RADIUS = int(SQUARESIZE / 2 - 5)
width = COLUMN_COUNT * SQUARESIZE
height = (ROW_COUNT + 1) * SQUARESIZE  # Extra space for buttons
size = (width, height)

PLAYER = 0
AI = 1
EMPTY = 0
PLAYER_PIECE = 1
AI_PIECE = 2
WINDOW_LENGTH = 4

# Variables for difficulty levels
EASY_DEPTH = 1
MEDIUM_DEPTH = 3
HARD_DEPTH = 5
ai_depth = MEDIUM_DEPTH  # Default is medium

# Initialize Pygame
pygame.init()
screen = pygame.display.set_mode(size)
myfont = pygame.font.SysFont("monospace", 60)
button_font = pygame.font.SysFont("monospace", 30)


# Create board
def create_board():
    return np.zeros((ROW_COUNT, COLUMN_COUNT))


def drop_piece(board, row, col, piece):
    board[row][col] = piece


def is_valid_location(board, col):
    return board[ROW_COUNT - 1][col] == 0


def get_next_open_row(board, col):
    for r in range(ROW_COUNT):
        if board[r][col] == 0:
            return r


def print_board(board):
    print(np.flip(board, 0))


def winning_move(board, piece):
    for c in range(COLUMN_COUNT - 3):
        for r in range(ROW_COUNT):
            if (
                board[r][c] == piece
                and board[r][c + 1] == piece
                and board[r][c + 2] == piece
                and board[r][c + 3] == piece
            ):
                return True
    for c in range(COLUMN_COUNT):
        for r in range(ROW_COUNT - 3):
            if (
                board[r][c] == piece
                and board[r + 1][c] == piece
                and board[r + 2][c] == piece
                and board[r + 3][c] == piece
            ):
                return True
    for c in range(COLUMN_COUNT - 3):
        for r in range(ROW_COUNT - 3):
            if (
                board[r][c] == piece
                and board[r + 1][c + 1] == piece
                and board[r + 2][c + 2] == piece
                and board[r + 3][c + 3] == piece
            ):
                return True
    for c in range(COLUMN_COUNT - 3):
        for r in range(3, ROW_COUNT):
            if (
                board[r][c] == piece
                and board[r - 1][c + 1] == piece
                and board[r - 2][c + 2] == piece
                and board[r - 3][c + 3] == piece
            ):
                return True


def evaluate_window(window, piece):
    score = 0
    opp_piece = PLAYER_PIECE if piece == AI_PIECE else AI_PIECE
    if window.count(piece) == 4:
        score += 100
    elif window.count(piece) == 3 and window.count(EMPTY) == 1:
        score += 5
    elif window.count(piece) == 2 and window.count(EMPTY) == 2:
        score += 2
    if window.count(opp_piece) == 3 and window.count(EMPTY) == 1:
        score -= 4
    return score


def score_position(board, piece):
    score = 0
    center_array = [int(i) for i in list(board[:, COLUMN_COUNT // 2])]
    score += center_array.count(piece) * 3

    for r in range(ROW_COUNT):
        row_array = [int(i) for i in list(board[r, :])]
        for c in range(COLUMN_COUNT - 3):
            window = row_array[c : c + WINDOW_LENGTH]
            score += evaluate_window(window, piece)

    for c in range(COLUMN_COUNT):
        col_array = [int(i) for i in list(board[:, c])]
        for r in range(ROW_COUNT - 3):
            window = col_array[r : r + WINDOW_LENGTH]
            score += evaluate_window(window, piece)

    for r in range(ROW_COUNT - 3):
        for c in range(COLUMN_COUNT - 3):
            window = [board[r + i][c + i] for i in range(WINDOW_LENGTH)]
            score += evaluate_window(window, piece)

    for r in range(ROW_COUNT - 3):
        for c in range(COLUMN_COUNT - 3):
            window = [board[r + 3 - i][c + i] for i in range(WINDOW_LENGTH)]
            score += evaluate_window(window, piece)

    return score


def is_terminal_node(board):
    return (
        winning_move(board, PLAYER_PIECE)
        or winning_move(board, AI_PIECE)
        or len(get_valid_locations(board)) == 0
    )


def minimax(board, depth, alpha, beta, maximizingPlayer):
    valid_locations = get_valid_locations(board)
    is_terminal = is_terminal_node(board)
    if depth == 0 or is_terminal:
        if is_terminal:
            if winning_move(board, AI_PIECE):
                return (None, 100000000000)
            elif winning_move(board, PLAYER_PIECE):
                return (None, -100000000000)
            else:
                return (None, 0)
        else:
            return (None, score_position(board, AI_PIECE))

    if maximizingPlayer:
        value = -math.inf
        column = random.choice(valid_locations)
        for col in valid_locations:
            row = get_next_open_row(board, col)
            b_copy = board.copy()
            drop_piece(b_copy, row, col, AI_PIECE)
            new_score = minimax(b_copy, depth - 1, alpha, beta, False)[1]
            if new_score > value:
                value = new_score
                column = col
            alpha = max(alpha, value)
            if alpha >= beta:
                break
        return column, value
    else:
        value = math.inf
        column = random.choice(valid_locations)
        for col in valid_locations:
            row = get_next_open_row(board, col)
            b_copy = board.copy()
            drop_piece(b_copy, row, col, PLAYER_PIECE)
            new_score = minimax(b_copy, depth - 1, alpha, beta, True)[1]
            if new_score < value:
                value = new_score
                column = col
            beta = min(beta, value)
            if alpha >= beta:
                break
        return column, value


def get_valid_locations(board):
    valid_locations = []
    for col in range(COLUMN_COUNT):
        if is_valid_location(board, col):
            valid_locations.append(col)
    return valid_locations


def draw_board(board):
    for c in range(COLUMN_COUNT):
        for r in range(ROW_COUNT):
            pygame.draw.rect(
                screen, BLUE, (c * SQUARESIZE, r * SQUARESIZE + SQUARESIZE, SQUARESIZE, SQUARESIZE)
            )
            pygame.draw.circle(
                screen,
                BLACK,
                (int(c * SQUARESIZE + SQUARESIZE / 2), int(r * SQUARESIZE + SQUARESIZE + SQUARESIZE / 2)),
                RADIUS,
            )

    for c in range(COLUMN_COUNT):
        for r in range(ROW_COUNT):
            if board[r][c] == PLAYER_PIECE:
                pygame.draw.circle(
                    screen,
                    RED,
                    (int(c * SQUARESIZE + SQUARESIZE / 2), height - int(r * SQUARESIZE + SQUARESIZE / 2)),
                    RADIUS,
                )
            elif board[r][c] == AI_PIECE:
                pygame.draw.circle(
                    screen,
                    YELLOW,
                    (int(c * SQUARESIZE + SQUARESIZE / 2), height - int(r * SQUARESIZE + SQUARESIZE / 2)),
                    RADIUS,
                )
    pygame.display.update()


def draw_buttons():
    easy_button = pygame.Rect(50, height - 150, 150, 50)
    medium_button = pygame.Rect(250, height - 150, 150, 50)
    hard_button = pygame.Rect(450, height - 150, 150, 50)

    # Vibrant colors for buttons
    pygame.draw.rect(screen, VIBRANT_GREEN, easy_button, border_radius=15)
    pygame.draw.rect(screen, VIBRANT_ORANGE, medium_button, border_radius=15)
    pygame.draw.rect(screen, VIBRANT_PURPLE, hard_button, border_radius=15)

    # Adding shadows for 3D effect
    pygame.draw.rect(screen, BLACK, easy_button.move(5, 5), border_radius=15)
    pygame.draw.rect(screen, BLACK, medium_button.move(5, 5), border_radius=15)
    pygame.draw.rect(screen, BLACK, hard_button.move(5, 5), border_radius=15)

    # Add button text
    easy_text = button_font.render("Easy", True, WHITE)
    medium_text = button_font.render("Medium", True, WHITE)
    hard_text = button_font.render("Hard", True, WHITE)

    screen.blit(easy_text, (70, height - 140))
    screen.blit(medium_text, (270, height - 140))
    screen.blit(hard_text, (470, height - 140))

    pygame.display.update()

    return easy_button, medium_button, hard_button


def main_menu():
    menu = True

    while menu:
        # Fill background with gradient
        for y in range(height):
            color_value = 50 + (y // 10)
            pygame.draw.line(screen, (color_value, color_value, 255), (0, y), (width, y))

        # Title text
        title = myfont.render("Select Difficulty", True, WHITE)
        shadow_title = myfont.render("Select Difficulty", True, BLACK)
        screen.blit(shadow_title, (42, 42))
        screen.blit(title, (40, 40))

        # Draw buttons
        easy_button, medium_button, hard_button = draw_buttons()

        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                pygame.quit()
                sys.exit()

            if event.type == pygame.MOUSEBUTTONDOWN:
                if easy_button.collidepoint(event.pos):
                    global ai_depth
                    ai_depth = EASY_DEPTH
                    menu = False
                elif medium_button.collidepoint(event.pos):
                    ai_depth = MEDIUM_DEPTH
                    menu = False
                elif hard_button.collidepoint(event.pos):
                    ai_depth = HARD_DEPTH
                    menu = False

        pygame.display.update()


# Main game loop
def start_game():
    board = create_board()
    print_board(board)
    game_over = False
    turn = random.randint(PLAYER, AI)

    while not game_over:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                sys.exit()

            if event.type == pygame.MOUSEMOTION:
                pygame.draw.rect(screen, BLACK, (0, 0, width, SQUARESIZE))
                posx = event.pos[0]
                if turn == PLAYER:
                    pygame.draw.circle(screen, RED, (posx, int(SQUARESIZE / 2)), RADIUS)

            pygame.display.update()

            if event.type == pygame.MOUSEBUTTONDOWN:
                pygame.draw.rect(screen, BLACK, (0, 0, width, SQUARESIZE))

                if turn == PLAYER:
                    posx = event.pos[0]
                    col = int(math.floor(posx / SQUARESIZE))

                    if is_valid_location(board, col):
                        row = get_next_open_row(board, col)
                        drop_piece(board, row, col, PLAYER_PIECE)

                        if winning_move(board, PLAYER_PIECE):
                            pygame.draw.rect(screen, BLACK, (0, 0, width, SQUARESIZE))
                            label = myfont.render("Player 1 wins!", True, RED)
                            screen.blit(label, (40, 10))
                            game_over = True

                        turn = AI
                        print_board(board)
                        draw_board(board)

        if turn == AI and not game_over:
            col, minimax_score = minimax(board, ai_depth, -math.inf, math.inf, True)

            if is_valid_location(board, col):
                pygame.time.wait(500)
                row = get_next_open_row(board, col)
                drop_piece(board, row, col, AI_PIECE)

                if winning_move(board, AI_PIECE):
                    pygame.draw.rect(screen, BLACK, (0, 0, width, SQUARESIZE))
                    label = myfont.render("AI wins!", True, YELLOW)
                    screen.blit(label, (40, 10))
                    game_over = True

                print_board(board)
                draw_board(board)

                turn = PLAYER

        if game_over:
            pygame.time.wait(5000)
            main_menu()


# Start the game with the main menu
main_menu()
start_game()