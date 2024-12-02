.data
x: .word 4
y: .word 6
z: .word 10

.text
main:
lw $a0, z
li $v0, 1
syscall