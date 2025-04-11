import { prisma } from '../src/lib/prisma'; // Certifique-se que este caminho está correto se você mudou o 'output' no schema.prisma
import bcrypt from 'bcryptjs';


async function main() {
    console.log('Iniciando o seeding');

    const username = 'admin';
    const plainPassword = 'senha123'; // Lembre-se de usar uma senha forte no seu ambiente real
    const name = 'Admin';

    const saltRound = 10; // Nota: no exemplo anterior usei 'saltRounds', mas 'saltRound' funciona igual
    const hashedPassword = await bcrypt.hash(plainPassword, saltRound);
    // Log corrigido (usando crase se quiser a variável dentro da string principal,
    // ou mantendo como estava se quiser logar o texto e a variável separadamente)
    console.log(`Senha para usuario ${username} hasheada.`); // Exemplo com crase para a mensagem
    // Ou mantenha o seu original se a intenção era logar a string e a variável separadamente:
    // console.log("Senha para usuario admin:", hashedPassword);

    const user = await prisma.user.upsert({
        where: { username: username },
        update: {
            name: name,
            password: hashedPassword,
        },
        create: {
            username: username,
            name: name,
            password: hashedPassword,
        },
    });

    // Log corrigido (usa crases)
    console.log(`Usuario ${user.username} criado/atualizado com ID ${user.id}`);
    console.log('Seeding concluído');
}

main()
    .catch(async (e) => {
        console.error('Erro durante o seeding:', e); // Adicionei uma mensagem mais descritiva aqui
        await prisma.$disconnect();
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });