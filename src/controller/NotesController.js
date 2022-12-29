const knex = require("../database/knex");

class NotesController{
  async create(request, response){
    const { title, description, tags, links} = request.body;
    const { user_id } = request.params;

    //insert table notes
    const note_id = await knex("notes").insert({
      title,
      description,
      user_id
    });

    //insert table links
    const linksInsert = links.map(link => {
      return {
        note_id,
        url: link
      }
    });
    await knex("links").insert(linksInsert);

    //insert table tags
    const tagsInsert = tags.map(name => {
      return {
        note_id,
        name,
        user_id
      }
    });
    await knex("tags").insert(tagsInsert);

    response.json();
  }

  async show(request, response) {
    const { id } = request.params;
    const note = await knex("notes").where({ id }).first();
    const tags = await knex("tags").where({ note_id: id}).orderBy("name");
    const links = await knex("links").where({ note_id: id}).orderBy("created_at");

    return response.json({
      ...note,
      tags,
      links
    });
  }

  async delete(request, response) {
    const { id } = request.params;

    await knex("notes").where({ id }).delete();

    return response.json();
  }

  async index(request, response) {
    const { title, user_id, tags } = request.query;
    let notes;

    //"split(",")" para converter textos em array/vetor, usando como delimitador a virgula nesse caso 
    if (tags) {
      const filterTags = tags.split(",").map(tag => tag.trim());

       //pesquisar por tag 
      notes = await knex("tags")
      .select([
        "notes.id",
        "notes.title",
        "notes.user_id",
      ])
      .where("notes.user_id", user_id)
      .whereLike("notes.title", `%${title}%`)
      .whereIn("name", filterTags)
      .innerJoin("notes", "notes.id", "tags.note_id")
      .orderBy("notes.title")

    // se a pesquisar não for por tag
    } else {
      notes = await knex("notes")
        .where({user_id})
        .whereLike("title", `%${title}%`)
        .orderBy("title");
    }

    const userTags = await knex("tags").where({user_id});
    const notesWithTags = notes.map(note => {
      const noteTags = userTags.filter(tag => tag.note_id === note.id);

      return {
        ...note,
        tags: noteTags
      }
    });

    return response.json(notesWithTags);
  }
}

module.exports = NotesController;