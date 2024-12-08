import random

winner = ''

random_choice = random.randint(0,2)
# print('The computer chooses' , random_choice)

if random_choice == 0 :
    computer_choice = 'rock'
elif random_choice == 1 :
    computer_choice = 'paper'
else :
    computer_choice = 'scissors'
# print("The computer chooses" , computer_choice)

# choices = [ 'rock' , 'paper' , 'scissors' ]
# computer_choice = random.choice(choices)

user_choice = ''
while (user_choice != 'rock' and
       user_choice != 'paper' and
       user_choice != 'scissors') :
    user_choice = input('rock, paper or scissors?')

# user_choice = input('rock, paper or scissors? ')
# print('You choose' , user_choice , 'and the computer choose' , computer_choice)

if computer_choice == user_choice :
    winner = 'Tie'
elif computer_choice == 'paper' and user_choice == 'rock' :
    winner = 'Computer'
elif computer_choice == 'rock' and user_choice == 'scissors' :
    winner = 'Computer'
elif computer_choice == 'scissors' and user_choice == 'paper' :
    winner = 'Computer'
else :
    winner = "User"

# print('The' , winner , 'wins!')

if winner == 'Tie' :
    print('We both choose' , computer_choice + ', play again.')
else :
    print(winner , 'won. The computer chose' , computer_choice + '.')