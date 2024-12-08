characters = ['t' , 'a' , 'c' , 'o']
# characters = ['a' , 'm' , 'a' , 'n' , 'a' , 'p' , 'l' , 'a' , 'n' , 'a' , 'c']
# characters = ['w' , 'a' , 's' , 'i' , 't' , 'a' , 'r']

output = ''
lenght = len(characters)

i = 0
while (i < lenght) :
    output = output + characters[i]
    i = i + 1

lenght = lenght * -1

i = -2
while (i >= lenght) :
    output = output + characters[i]
    i = i -1

print(output)